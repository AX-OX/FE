import type { ApprovalRequest, DocumentDetail, TaskDetail, TaskEvent } from '@/types/task'
import { request, USE_MOCK } from './client'
import * as mock from './mock/taskMock'
import { openSse } from './sse'

/** `POST /api/ai/tasks` → 202 { taskId } */
export function createTask(requestText: string): Promise<{ taskId: string }> {
  if (USE_MOCK) return mock.createTask(requestText)
  return request('/api/ai/tasks', { method: 'POST', body: JSON.stringify({ requestText }) })
}

/** `GET /api/ai/tasks/{taskId}` */
export function getTask(taskId: string): Promise<TaskDetail> {
  if (USE_MOCK) return mock.getTask(taskId)
  return request(`/api/ai/tasks/${taskId}`)
}

/** `POST /api/ai/tasks/{taskId}/approval` → 202 (작업 요청자 본인만) */
export function submitApproval(taskId: string, body: ApprovalRequest): Promise<void> {
  if (USE_MOCK) return mock.submitApproval(taskId, body)
  return request(`/api/ai/tasks/${taskId}/approval`, { method: 'POST', body: JSON.stringify(body) })
}

/** `GET /api/docs/{documentId}` — 근거 원문 */
export function getDocument(documentId: number): Promise<DocumentDetail> {
  if (USE_MOCK) return mock.getDocument(documentId)
  return request(`/api/docs/${documentId}`)
}

export interface StreamHandlers {
  onEvent: (event: TaskEvent) => void
  /** 끊겼다가 다시 연결됨 → 호출 측에서 `getTask`로 상태를 다시 맞춘다 */
  onReconnect: () => void
  /** 재연결도 실패해 스트림을 포기했을 때 */
  onError: (status?: number) => void
}

/**
 * `GET /api/ai/tasks/{taskId}/stream` (SSE). `Authorization: Bearer` 헤더로 인증한다.
 * 반환값을 호출하면 구독을 끊는다.
 */
export function subscribeTaskEvents(taskId: string, handlers: StreamHandlers): () => void {
  if (USE_MOCK) return mock.subscribe(taskId, handlers.onEvent)

  return openSse(`/api/ai/tasks/${taskId}/stream`, {
    onMessage: (data) => {
      try {
        handlers.onEvent(JSON.parse(data) as TaskEvent)
      } catch {
        // 형식이 깨진 이벤트는 무시
      }
    },
    onReconnect: handlers.onReconnect,
    onError: handlers.onError,
  })
}
