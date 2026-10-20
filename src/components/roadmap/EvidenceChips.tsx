import type { Evidence } from '@/types/task'
import { useChatStore } from '@/stores/chatStore'

/** 근거 문서 → 클릭하면 원문 패널 (rag-mcp Resource `docs://{id}`) */
export function EvidenceChips({ evidence }: { evidence: Evidence[] }) {
  const openDocument = useChatStore((s) => s.openDocument)
  if (!evidence.length) return null

  return (
    <ul className="flex flex-wrap gap-1.5">
      {evidence.map((e, i) => (
        <li key={`${e.documentId}-${i}`}>
          <button
            type="button"
            onClick={() => openDocument(e.documentId)}
            title={e.summary}
            className="inline-flex max-w-full items-center gap-1 rounded-md border border-line/50 bg-white/70 px-2 py-1 text-left text-[11px] text-muted transition-colors hover:border-accent/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg viewBox="0 0 16 16" className="size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 1.5h5.5L13 5v9.5H4z M9 1.5V5.5h4" strokeLinejoin="round" />
            </svg>
            <span className="truncate">
              {e.title ?? `문서 ${e.documentId}`}
              {e.section && ` · ${e.section}`}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
