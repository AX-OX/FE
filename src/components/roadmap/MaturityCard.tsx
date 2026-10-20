import { useChatStore } from '@/stores/chatStore'
import type { Maturity } from '@/types/task'
import { MATURITY_AREAS } from './labels'

/** 성숙도 5개 영역 (0~100) + 가중합 */
export function MaturityCard({ maturity }: { maturity: Maturity }) {
  const openDocument = useChatStore((s) => s.openDocument)
  // Agent 결과가 일부만 올 수 있다
  const scores = maturity.scores ?? {}
  const evidenceList = maturity.evidence ?? []
  const insufficient = maturity.insufficientData ?? []

  return (
    <section className="rounded-lg bg-white/70 p-3.5" aria-labelledby="maturity-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 id="maturity-title" className="text-[13px] font-medium">
            AX 성숙도
          </h4>
          <p className="text-[11px] text-muted">{maturity.criteriaVersion ? `기준표 ${maturity.criteriaVersion} · ` : ''}5개 영역 가중합</p>
        </div>
        <p className="text-right">
          <span className="text-2xl font-semibold tracking-tight">{maturity.totalScore == null ? '–' : maturity.totalScore.toFixed(1)}</span>
          <span className="text-[12px] text-muted"> / 100</span>
        </p>
      </div>

      <ul className="mt-3 space-y-2.5">
        {MATURITY_AREAS.map(({ key, label, weight }) => {
          const score = scores[key]
          const evidence = evidenceList.find((e) => e.area === key)
          return (
            <li key={key} className="grid grid-cols-[96px_minmax(0,1fr)_32px] items-center gap-2 text-[12px] sm:grid-cols-[120px_minmax(0,1fr)_32px]">
              <span className="truncate">
                {label} <span className="text-[10px] text-muted">×{weight}</span>
              </span>
              {score === undefined ? (
                <span className="text-[11px] text-muted">근거 부족</span>
              ) : (
                <div className="h-2 overflow-hidden rounded-full bg-ink/8" title={evidence?.summary}>
                  <div className="h-full rounded-full bg-accent" style={{ width: `${score}%` }} />
                </div>
              )}
              <span className="text-right font-semibold">{score ?? '–'}</span>
              {evidence && (
                <button
                  type="button"
                  onClick={() => openDocument(evidence.documentId)}
                  className="col-span-3 -mt-1 truncate text-left text-[11px] text-muted hover:text-ink hover:underline sm:col-start-2 sm:col-end-4"
                >
                  {evidence.summary ?? evidence.title ?? `문서 ${evidence.documentId}`}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {insufficient.length > 0 && (
        <p className="mt-3 text-[11px] text-muted">근거가 부족해 점수를 내지 않은 영역: {insufficient.join(', ')}</p>
      )}
    </section>
  )
}
