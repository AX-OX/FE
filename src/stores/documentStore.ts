import { create } from 'zustand'
import { ApiError } from '@/api/client'
import { listDocuments, uploadDocument, validatePdf } from '@/api/documents'
import { useAuthStore } from '@/stores/authStore'
import type { DocumentSummary } from '@/types/task'

/** 색인 중(UPLOADED) 문서가 있는 동안 목록을 다시 조회하는 간격 */
const POLL_MS = 3_000

interface DocumentState {
  documents: DocumentSummary[]
  /** 첫 목록 조회가 끝났는지 (업로드 안내를 조회 전에 띄우지 않는다) */
  loaded: boolean
  uploading: boolean
  error?: string
  load: () => Promise<void>
  upload: (file: File) => Promise<void>
  dismissError: () => void
  reset: () => void
}

let pollTimer: number | undefined

export const useDocumentStore = create<DocumentState>()((set, get) => {
  /** 색인이 끝날 때까지만 다시 조회한다. 서버는 색인 완료를 알리지 않는다 */
  function schedulePoll() {
    window.clearTimeout(pollTimer)
    if (get().documents.some((d) => d.status === 'UPLOADED')) pollTimer = window.setTimeout(() => void get().load(), POLL_MS)
  }

  return {
    documents: [],
    loaded: false,
    uploading: false,

    async load() {
      try {
        const documents = await listDocuments()
        // 조회하는 사이 로그아웃했으면 버린다
        if (!useAuthStore.getState().accessToken) return
        set({ documents, loaded: true })
      } catch (err) {
        set({ loaded: true, error: err instanceof ApiError ? err.message : '문서 목록을 불러오지 못했습니다.' })
      }
      schedulePoll()
    },

    async upload(file) {
      const invalid = validatePdf(file)
      if (invalid) return set({ error: invalid })
      set({ uploading: true, error: undefined })
      try {
        // 중복(409 DUPLICATE_DOCUMENT)·문서 수 한도(409)·형식(400)은 서버 메시지를 그대로 보여 준다
        await uploadDocument(file)
        await get().load()
      } catch (err) {
        set({ error: err instanceof ApiError ? err.message : '업로드하지 못했습니다. 다시 시도해 주세요.' })
      } finally {
        set({ uploading: false })
      }
    },

    dismissError() {
      set({ error: undefined })
    },

    reset() {
      window.clearTimeout(pollTimer)
      set({ documents: [], loaded: false, uploading: false, error: undefined })
    },
  }
})

// 세션이 끝나면 목록과 조회를 정리한다 (다른 계정에 이전 회사 문서가 보이지 않게)
useAuthStore.subscribe((state, prev) => {
  if (prev.accessToken && !state.accessToken) useDocumentStore.getState().reset()
})

/** 사용자가 올린 문서만 (시드 회사의 매뉴얼 등은 근거 칩으로만 연다) */
export const uploadedOnly = (documents: DocumentSummary[]) => documents.filter((d) => d.docType === 'UPLOADED')
