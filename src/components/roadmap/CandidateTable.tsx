import { formatKrwShort, formatMonths, formatPct } from '@/lib/format'
import type { CandidateRoi } from '@/types/task'
import { SOLUTION_LABEL } from './labels'

/** 후보 전체 비교 — 차트의 표 보기 역할도 겸한다 */
export function CandidateTable({ candidates }: { candidates: CandidateRoi[] }) {
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority)

  return (
    <details className="group rounded-lg bg-white/70 p-3.5">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-medium">
        후보 과제 전체 비교 ({candidates.length}개)
        <svg viewBox="0 0 16 16" className="size-4 text-muted transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <p className="mt-1 text-[11px] text-muted">우선순위 = 0.5 × ROI(정규화) + 0.3 × 실현 가능성 + 0.2 × 절감액(정규화)</p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-[12px]">
          <thead className="text-left text-[11px] text-muted">
            <tr>
              <th className="py-1.5 pr-2 font-medium">업무</th>
              <th className="py-1.5 pr-2 font-medium">솔루션</th>
              <th className="py-1.5 pr-2 text-right font-medium">1년 차 비용</th>
              <th className="py-1.5 pr-2 text-right font-medium">기준 ROI</th>
              <th className="py-1.5 pr-2 text-right font-medium">회수</th>
              <th className="py-1.5 pr-2 text-right font-medium">실현 가능성</th>
              <th className="py-1.5 pr-2 text-right font-medium">우선순위</th>
              <th className="py-1.5 text-center font-medium">선정</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={`${c.processId}-${c.solutionId}`} className={`border-t border-ink/6 ${c.selected ? 'font-medium' : 'text-muted'}`}>
                <td className="py-1.5 pr-2">
                  {c.processName} <span className="text-[10px] text-muted">{c.departmentName}</span>
                </td>
                <td className="py-1.5 pr-2">{SOLUTION_LABEL[c.solutionType] ?? c.solutionType}</td>
                <td className="py-1.5 pr-2 text-right">{formatKrwShort(c.firstYearCostKrw)}</td>
                <td className="py-1.5 pr-2 text-right">{formatPct(c.scenarios.base.roiPct)}</td>
                <td className="py-1.5 pr-2 text-right">{formatMonths(c.scenarios.base.paybackMonths)}</td>
                <td className="py-1.5 pr-2 text-right">{c.feasibilityScore.toFixed(1)}</td>
                <td className="py-1.5 pr-2 text-right">{c.priority.toFixed(2)}</td>
                <td className="py-1.5 text-center">{c.selected ? <span className="text-accent">✓<span className="sr-only">선정</span></span> : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
