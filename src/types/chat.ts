export type ChatIntent = 'GREETING' | 'SERVICE_QA' | 'RESULT_QA' | 'ANALYZE' | 'CLARIFY' | 'OUT_OF_SCOPE'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  history: ChatMessage[]
  referenceTaskId?: string
}

export interface ChatReply {
  intent: ChatIntent
  message: string
  taskId: string | null
}
