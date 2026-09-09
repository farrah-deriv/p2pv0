export interface KratosFlowNode {
  attributes: { name: string; value?: string }
  messages: Array<{ type: string; text: string }>
}

export interface KratosFlow {
  id: string
  state?: string
  ui?: {
    nodes?: KratosFlowNode[]
    messages?: Array<{ type: string; text: string }>
  }
}

export function extractCsrfToken(flow: KratosFlow): string {
  return flow.ui?.nodes?.find((node) => node.attributes.name === "csrf_token")?.attributes?.value ?? ""
}

/** Returns a safe, displayable Kratos error message, if the flow contains one. */
export function extractFlowErrorText(flow: KratosFlow): string {
  const nodeErrors = (flow.ui?.nodes ?? []).flatMap((node) => node.messages).filter((message) => message.type === "error")
  const uiErrors = (flow.ui?.messages ?? []).filter((message) => message.type === "error")
  return nodeErrors[0]?.text ?? uiErrors[0]?.text ?? ""
}
