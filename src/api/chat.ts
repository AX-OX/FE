import type { ChatReply, ChatRequest } from '@/types/chat'
import { ApiError, request, USE_MOCK } from './client'

/** One message is not one analysis. Never fall back to /tasks on failure. */
export async function sendChatMessage(body: ChatRequest): Promise<ChatReply> {
  if (USE_MOCK) return (await import('./mock/chatMock')).sendChatMessage(body)
  const reply = await request<ChatReply>('/api/ai/chat/messages', { method: 'POST', body: JSON.stringify(body) })
  const intents = ['GREETING', 'SERVICE_QA', 'RESULT_QA', 'ANALYZE', 'CLARIFY', 'OUT_OF_SCOPE']
  if (!reply || !intents.includes(reply.intent) || typeof reply.message !== 'string' || !reply.message.trim()
      || (reply.intent === 'ANALYZE'
        ? typeof reply.taskId !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(reply.taskId)
        : reply.taskId != null)) {
    throw new ApiError(503, { code: 'AI_UNAVAILABLE', message: '응답을 확인하지 못했어요. 작업 이력을 확인한 후 다시 시도해 주세요.' })
  }
  return reply
}
