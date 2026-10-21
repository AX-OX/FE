import type { ExcludedProcess, PortfolioWarning } from '@/types/task'
import { WARNING_LABEL } from './labels'

interface ExcludedListProps {
  /** portfolio.excluded — 사람에 대한 최종 판단을 AI가 하게 되는 업무 등 */
  excluded: ExcludedProcess[]
  /** portfolio.warnings — 최근 3개월 지표가 부족해 선정 후보에서 뺀 후보 */
  warnings: PortfolioWarning[]
  nameOfProcess: (processId: number) => string | undefined
}

/** 분석에서 제외한 업무와 사유 */
export function ExcludedList({ excluded, warnings, nameOfProcess }: ExcludedListProps) {
  const count = excluded.length + warnings.length
  if (!count) return null

  return (
    <section className="rounded-lg bg-white/70 p-3.5" aria-labelledby="excluded-title">
      <h4 id="excluded-title" className="text-[13px] font-medium">
        분석에서 제외한 업무 ({count}건)
      </h4>
      <ul className="mt-2 space-y-1.5 text-[12px]">
        {excluded.map((e) => (
          <li key={`ex-${e.processId}`} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{e.processName ?? nameOfProcess(e.processId) ?? `업무 ${e.processId}`}</span>
            <span className="text-muted">사유: {e.reason}</span>
          </li>
        ))}
        {warnings.map((w) => (
          <li key={`warn-${w.processId}-${w.solutionId}`} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{nameOfProcess(w.processId) ?? `업무 ${w.processId}`}</span>
            <span className="text-muted">
              사유: {WARNING_LABEL[w.code] ?? w.code}
              {w.missingMonths.length > 0 && ` (없는 월: ${w.missingMonths.join(', ')})`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
