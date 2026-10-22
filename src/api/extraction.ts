import type { ExtractionDraft, ExtractionPayload } from '@/types/extraction'
import { request, USE_MOCK } from './client'
import * as mock from './mock/taskMock'

/** `GET /api/ai/tasks/{taskId}/extraction` — AI가 PDF에서 추출한 기업 데이터 (요청자 본인만) */
export function getExtraction(taskId: string): Promise<ExtractionDraft> {
  if (USE_MOCK) return mock.getExtraction(taskId)
  return request(`/api/ai/tasks/${taskId}/extraction`)
}

/**
 * `PUT /api/ai/tasks/{taskId}/extraction/confirm` — 수정한 payload 전체 → 202.
 * 서버가 부서·업무·지표·시스템을 저장하고 분석을 이어간다. 회사당 한 번만 확정한다(이후 409).
 */
export function confirmExtraction(taskId: string, payload: ExtractionPayload): Promise<void> {
  if (USE_MOCK) return mock.confirmExtraction(taskId, payload)
  return request(`/api/ai/tasks/${taskId}/extraction/confirm`, { method: 'PUT', body: JSON.stringify(payload) })
}
