/** Reads a login identifier from BFF JSON bodies (`identifier` preferred, `email` legacy). */
export function readLoginIdentifier(body: { identifier?: string; email?: string } | null | undefined): string {
  if (typeof body?.identifier === "string" && body.identifier.trim()) {
    return body.identifier.trim()
  }
  if (typeof body?.email === "string" && body.email.trim()) {
    return body.email.trim()
  }
  return ""
}
