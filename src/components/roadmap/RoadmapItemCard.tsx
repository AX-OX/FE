import { formatKrwShort, formatMonths, formatPct } from '@/lib/format'
import type { CandidateRoi, RoadmapItem, Scenario } from '@/types/task'
import { EvidenceChips } from './EvidenceChips'
import { PHASE_LABEL, SCENARIO_LABEL, SOLUTION_LABEL } from './labels'

interface RoadmapItemCardProps {
  item: RoadmapItem
  candidate?: CandidateRoi
}

const SCENARIOS: Scenario[] = ['low', 'base', 'high']

export function RoadmapItemCard({ item, candidate }: RoadmapItemCardProps) {
  const solution = item.solutionType ? (SOLUTION_LABEL[item.solutionType] ?? item.solutionType) : undefined

  return (
    <article className="flex flex-col gap-3 rounded-lg bg-white/70 p-3.5">
      <header className="flex items-start gap-2.5">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white" aria-label={`우선순위 ${item.priorityOrder}`}>
          {item.priorityOrder}
        </span>
        <div className="min-w-0">
          <h4 className="text-[15px] leading-snug font-semibold">{item.itemName}</h4>
          <p className="mt-0.5 text-[12px] text-muted">
            {[item.departmentName, solution, `${PHASE_LABEL[item.phase]} 과제`].filter(Boolean).join(' · ')}
          </p>
        </div>
      </header>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] text-muted">기준 ROI (1년 차)</p>
          <p className="text-2xl font-semibold tracking-tight text-accent">{formatPct(item.roiPct)}</p>
        </div>
        <p className="text-right text-[12px] text-muted">
          투자금 회수
          <br />
          <span className="text-sm font-semibold text-ink">{formatMonths(item.paybackMonths)}</span>
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-md bg-ink/4 px-2 py-1.5">
          <dt className="text-muted">배정 예산</dt>
          <dd className="font-semibold">{formatKrwShort(item.allocatedBudgetKrw)}</dd>
        </div>
        <div className="rounded-md bg-ink/4 px-2 py-1.5">
          <dt className="text-muted">연간 절감</dt>
          <dd className="font-semibold">{formatKrwShort(item.expectedAnnualSavingKrw)}</dd>
        </div>
      </dl>

      {candidate && (
        <table className="w-full text-[12px]">
          <caption className="mb-1 text-left text-[11px] text-muted">시나리오별 ROI</caption>
          <tbody>
            <tr>
              {SCENARIOS.map((s) => (
                <td key={s} className={`border-white px-1.5 py-1 text-center ${s === 'base' ? 'rounded-md bg-accent/10' : ''}`}>
                  <span className="block text-[10px] text-muted">{SCENARIO_LABEL[s]}</span>
                  <span className="font-semibold">{formatPct(candidate.scenarios[s].roiPct)}</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      )}

      <p className="text-[13px] leading-relaxed">{item.rationale}</p>
      <EvidenceChips evidence={item.evidence} />
    </article>
  )
}
