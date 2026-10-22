import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import type { DocumentDetail, DocumentStatus, DocumentSummary } from '@/types/task'
import { DOCUMENTS } from './fixtures'

/**
 * 업로드·색인 흉내. 올린 PDF는 2.5초 뒤 INDEXED가 된다 (파일 내용은 읽지 않는다).
 * - 파일 이름에 '스캔'이 들어가면 FAILED (텍스트 없는 PDF)
 * - 데모 계정만 시드 문서(401~408)가 있다. 새로 가입한 계정은 업로드 문서만 보인다
 * - 메모리에만 있어서 새로고침하면 사라진다
 */

interface MockUpload {
  ownerId: number | undefined
  summary: DocumentSummary
  pages: { page: number; text: string }[]
}

const uploads = new Map<number, MockUpload>()
let nextId = 9001
const MAX_DOCUMENTS = 20
const DEMO_USER_ID = 1

const currentUserId = () => useAuthStore.getState().user?.userId
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function mine() {
  const me = currentUserId()
  return [...uploads.values()].filter((u) => u.ownerId === me)
}

export async function uploadDocument(file: File): Promise<{ documentId: number; status: DocumentStatus }> {
  await wait(500)
  if (!file.name.toLowerCase().endsWith('.pdf')) throw new ApiError(400, { code: 'VALIDATION_ERROR', message: 'PDF 파일만 업로드할 수 있습니다.' })
  const active = mine().filter((u) => u.summary.status !== 'FAILED')
  if (active.some((u) => u.summary.title === file.name && u.summary.fileSize === file.size)) {
    throw new ApiError(409, { code: 'DUPLICATE_DOCUMENT', message: '이미 업로드한 문서입니다.' })
  }
  if (active.length >= MAX_DOCUMENTS) {
    throw new ApiError(409, { code: 'INVALID_STATE', message: `기업당 문서는 최대 ${MAX_DOCUMENTS}개까지 등록할 수 있습니다.` })
  }
  const documentId = nextId++
  const upload: MockUpload = {
    ownerId: currentUserId(),
    summary: { documentId, title: file.name, docType: 'UPLOADED', status: 'UPLOADED', fileSize: file.size, pageCount: null, createdAt: new Date().toISOString() },
    pages: [
      { page: 1, text: `${file.name.replace(/\.pdf$/i, '')}\n\n인사팀은 매월 약 120건의 규정 문의에 답한다. 건당 평균 15분이 걸린다.` },
      { page: 2, text: '그룹웨어로 결재를 처리하며, 보안 정책상 개인정보는 외부로 보내지 않는다.' },
    ],
  }
  uploads.set(documentId, upload)
  window.setTimeout(() => {
    const failed = file.name.includes('스캔')
    upload.summary = { ...upload.summary, status: failed ? 'FAILED' : 'INDEXED', pageCount: failed ? null : upload.pages.length }
  }, 2500)
  return { documentId, status: 'UPLOADED' }
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  await wait(200)
  const seed: DocumentSummary[] =
    currentUserId() === DEMO_USER_ID
      ? Object.values(DOCUMENTS).map((d) => ({ documentId: d.documentId, title: d.title, docType: d.docType, status: 'INDEXED', fileSize: null, pageCount: null, createdAt: '2026-10-19T10:00:00' }))
      : []
  const own = mine().map((u) => u.summary)
  return [...own.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), ...seed]
}

/** 현재 사용자가 올려 색인이 끝난 문서 (추출 mock이 근거로 쓴다) */
export function indexedUploads(): DocumentSummary[] {
  return mine()
    .map((u) => u.summary)
    .filter((d) => d.status === 'INDEXED')
}

/** 업로드 문서 원문. 업로드 문서가 아니면 undefined (시드 문서는 taskMock이 준다) */
export function uploadedDocument(documentId: number): DocumentDetail | undefined {
  const upload = uploads.get(documentId)
  if (!upload) return undefined
  if (upload.ownerId !== currentUserId()) throw new ApiError(403, { code: 'FORBIDDEN', message: '접근 권한이 없습니다.' })
  if (upload.summary.status !== 'INDEXED') {
    throw new ApiError(409, { code: 'INVALID_STATE', message: `문서 색인이 끝나지 않았습니다. 상태: ${upload.summary.status}` })
  }
  return {
    documentId,
    title: upload.summary.title,
    docType: 'UPLOADED',
    version: 'v1',
    accessLevel: 'INTERNAL',
    content: upload.pages.map((p) => p.text).join('\n\n'),
    pages: upload.pages,
  }
}
