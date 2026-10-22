import type { DocumentSummary, DocumentStatus } from '@/types/task'
import { request, USE_MOCK } from './client'
import * as mock from './mock/documentMock'

/** 서버와 같은 한도 (서버도 검사한다) */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

/** `POST /api/documents` multipart `file`(PDF) → 201 { documentId, status: UPLOADED }. 색인은 서버가 비동기로 한다 */
export function uploadDocument(file: File): Promise<{ documentId: number; status: DocumentStatus }> {
  if (USE_MOCK) return mock.uploadDocument(file)
  const body = new FormData()
  body.append('file', file)
  return request('/api/documents', { method: 'POST', body })
}

/** `GET /api/documents` — 내 회사 문서 (최신순). 색인 결과는 이 목록을 다시 조회해 확인한다 */
export function listDocuments(): Promise<DocumentSummary[]> {
  if (USE_MOCK) return mock.listDocuments()
  return request('/api/documents')
}

/** 서버에 보내기 전에 거를 수 있는 오류 */
export function validatePdf(file: File): string | undefined {
  const pdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!pdf) return 'PDF 파일만 올릴 수 있어요.'
  if (file.size === 0) return '빈 파일은 올릴 수 없어요.'
  if (file.size > MAX_UPLOAD_BYTES) return '파일은 20MB 이하여야 해요.'
}
