import { Badge } from '@/components/roadmap/Badges'
import { useChatStore } from '@/stores/chatStore'
import { uploadedOnly, useDocumentStore } from '@/stores/documentStore'
import type { DocumentSummary } from '@/types/task'

const FAILED_HELP = '스캔본이나 암호가 걸린 PDF는 텍스트를 읽지 못해요. 텍스트가 있는 PDF로 다시 올려 주세요.'

function StatusBadge({ doc }: { doc: DocumentSummary }) {
  if (doc.status === 'UPLOADED') return <Badge tone="accent">읽는 중</Badge>
  if (doc.status === 'FAILED')
    return (
      <Badge tone="warn" title={FAILED_HELP}>
        읽기 실패
      </Badge>
    )
  return <Badge>{doc.pageCount ? `${doc.pageCount}쪽` : '완료'}</Badge>
}

/** 채팅 입력창 위 — 올린 PDF와 색인 상태, 업로드 안내·오류 */
export function DocumentTray() {
  const documents = useDocumentStore((s) => s.documents)
  const loaded = useDocumentStore((s) => s.loaded)
  const error = useDocumentStore((s) => s.error)
  const dismissError = useDocumentStore((s) => s.dismissError)
  const openDocument = useChatStore((s) => s.openDocument)
  const uploaded = uploadedOnly(documents)
  const hasIndexed = documents.some((d) => d.status === 'INDEXED')
  // 회사 문서가 하나도 없으면 분석할 데이터가 없다 (분석 요청은 PDF가 있어야 한다)
  const notice = !loaded || hasIndexed
    ? undefined
    : uploaded.some((d) => d.status === 'UPLOADED')
      ? 'PDF를 읽고 있어요. 읽기가 끝나면 그 내용으로 분석해요.'
      : '분석할 회사의 소개서나 업무 매뉴얼 PDF를 먼저 올려 주세요. 문서에서 회사 데이터를 추출해 분석해요.'

  if (!uploaded.length && !notice && !error) return null

  return (
    <div className="mb-2 space-y-1.5">
      {error && (
        <p role="alert" className="flex items-start justify-between gap-2 rounded-md bg-danger/8 px-2.5 py-1.5 text-[13px] text-danger">
          {error}
          <button type="button" onClick={dismissError} aria-label="오류 닫기" className="shrink-0 font-semibold hover:underline">
            닫기
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className="px-1 text-[13px] text-muted">
          {notice}
        </p>
      )}
      {uploaded.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="올린 문서">
          {uploaded.map((doc) => {
            const label = (
              <>
                <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                  <path d="M4 1.5h5l3 3v10H4z M9 1.5v3h3" strokeLinejoin="round" />
                </svg>
                <span className="max-w-[180px] truncate">{doc.title}</span>
                <StatusBadge doc={doc} />
              </>
            )
            const cls = 'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-[12px]'
            return (
              <li key={doc.documentId}>
                {doc.status === 'INDEXED' ? (
                  <button type="button" onClick={() => openDocument(doc.documentId)} title="읽은 내용 보기" className={`${cls} hover:border-line-strong`}>
                    {label}
                  </button>
                ) : (
                  <span className={cls} title={doc.status === 'FAILED' ? FAILED_HELP : undefined}>
                    {label}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
