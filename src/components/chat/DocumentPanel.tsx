import { useEffect, useRef, useState } from 'react'
import { ApiError } from '@/api/client'
import { getDocument } from '@/api/tasks'
import { useChatStore } from '@/stores/chatStore'
import type { DocumentDetail } from '@/types/task'
import { Markdown } from './Markdown'

type LoadState = { id: number } & ({ status: 'error'; message: string } | { status: 'ready'; doc: DocumentDetail })

/** 근거 원문 패널 — `GET /api/docs/{documentId}` */
export function DocumentPanel() {
  const documentId = useChatStore((s) => s.openDocumentId)
  const openDocument = useChatStore((s) => s.openDocument)
  const [loaded, setLoaded] = useState<LoadState | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (documentId === null) return
    let ignore = false
    getDocument(documentId)
      .then((doc) => !ignore && setLoaded({ id: documentId, status: 'ready', doc }))
      .catch((err) => !ignore && setLoaded({ id: documentId, status: 'error', message: err instanceof ApiError ? err.message : '문서를 불러오지 못했습니다.' }))
    closeRef.current?.focus()
    return () => {
      ignore = true
    }
  }, [documentId])

  useEffect(() => {
    if (documentId === null) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openDocument(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [documentId, openDocument])

  if (documentId === null) return null
  const close = () => openDocument(null)
  // 다른 문서를 열면 이전 결과는 버리고 로딩으로 보인다
  const state = loaded?.id === documentId ? loaded : ({ status: 'loading' } as const)

  return (
    <div className="absolute inset-0 z-30 flex justify-end">
      <button type="button" aria-label="문서 닫기" onClick={close} className="absolute inset-0 bg-ink/10 backdrop-blur-[1px]" tabIndex={-1} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-title"
        className="relative flex h-full w-full flex-col border-l border-white bg-white/95 shadow-[-8px_0_32px_rgb(22_2_17/0.08)] backdrop-blur-md sm:w-[460px]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-ink/6 p-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted">
              근거 문서{state.status === 'ready' && ` · ${state.doc.docType}${state.doc.version ? ` · ${state.doc.version}` : ''}`}
            </p>
            <h2 id="doc-title" className="truncate text-base font-semibold">
              {state.status === 'ready' ? state.doc.title : `문서 ${documentId}`}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="닫기"
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-line-strong"
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 text-sm leading-relaxed">
          {state.status === 'loading' && <p className="text-muted">불러오는 중…</p>}
          {state.status === 'error' && (
            <p role="alert" className="text-danger">
              {state.message}
            </p>
          )}
          {state.status === 'ready' && <Markdown>{state.doc.content}</Markdown>}
        </div>
      </aside>
    </div>
  )
}
