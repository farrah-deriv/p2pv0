const http = require("http")
const https = require("https")
const next = require("next")

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development"
}

const port = Number(process.env.PORT || 3000)
const hostname = process.env.HOST || "localhost"
const websocketPath = "/api/proxy/ws/p2p/v1/events"

function getSocketUpstream() {
  const rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL
  if (!rawUrl) {
    throw new Error("Missing required env var: NEXT_PUBLIC_SOCKET_URL")
  }

  const upstream = new URL(rawUrl)
  if (upstream.protocol !== "wss:" && upstream.protocol !== "ws:") {
    throw new Error("NEXT_PUBLIC_SOCKET_URL must use ws:// or wss://")
  }

  return upstream
}

function proxyWebSocketUpgrade(clientRequest, clientSocket, head) {
  let upstream
  try {
    upstream = getSocketUpstream()
  } catch (error) {
    clientSocket.end("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n")
    console.error("[dev-ws-proxy]", error.message)
    return
  }

  const headers = { ...clientRequest.headers }
  delete headers.host
  delete headers.origin
  delete headers["sec-websocket-protocol"]

  const upstreamRequest = (upstream.protocol === "wss:" ? https : http).request({
    protocol: upstream.protocol === "wss:" ? "https:" : "http:",
    hostname: upstream.hostname,
    port: upstream.port || undefined,
    method: "GET",
    path: `/p2p/v1/events${new URL(clientRequest.url, "http://localhost").search}`,
    headers: {
      ...headers,
      host: upstream.host,
      origin: `${upstream.protocol === "wss:" ? "https" : "http"}://${upstream.host}`,
      connection: "Upgrade",
      upgrade: "websocket",
    },
  })

  upstreamRequest.on("upgrade", (upstreamResponse, upstreamSocket, upstreamHead) => {
    const responseHeaders = Object.entries(upstreamResponse.headers)
      .flatMap(([name, value]) => (Array.isArray(value) ? value.map((entry) => [name, entry]) : [[name, value]]))
      .filter(([, value]) => value !== undefined)
      .map(([name, value]) => `${name}: ${value}`)
      .join("\r\n")

    clientSocket.write(`HTTP/${upstreamResponse.httpVersion} ${upstreamResponse.statusCode} ${upstreamResponse.statusMessage}\r\n${responseHeaders}\r\n\r\n`)
    if (head.length > 0) upstreamSocket.write(head)
    if (upstreamHead.length > 0) clientSocket.write(upstreamHead)

    upstreamSocket.pipe(clientSocket)
    clientSocket.pipe(upstreamSocket)

    upstreamSocket.on("error", () => clientSocket.destroy())
    clientSocket.on("error", () => upstreamSocket.destroy())
  })

  upstreamRequest.on("response", (response) => {
    clientSocket.end(`HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\nConnection: close\r\n\r\n`)
  })

  upstreamRequest.on("error", (error) => {
    console.error("[dev-ws-proxy] upgrade failed:", error.message)
    clientSocket.end("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n")
  })

  upstreamRequest.end()
}

const app = next({ dev: true, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = http.createServer((request, response) => handle(request, response))
  const nextUpgradeHandler = app.getUpgradeHandler()

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url, "http://localhost").pathname
    if (pathname === websocketPath) {
      proxyWebSocketUpgrade(request, socket, head)
      return
    }

    nextUpgradeHandler(request, socket, head)
  })

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
