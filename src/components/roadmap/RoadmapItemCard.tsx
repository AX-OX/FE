import { formatKrwShort, formatMonths, formatPct, formatScore } from '@/lib/format'
import type { CandidateScore, RoadmapItem, Scenario, ScenarioMetrics } from '@/types/task'
import { HelpIcon, ItemBadges } from './Badges'
import { EvidenceChips } from './EvidenceChips'
import { PHASE_LABEL, ROI_HELP, SCENARIO_LABEL, SOLUTION_LABEL } from './labels'

interface RoadmapItemCardProps {
  item: RoadmapItem
  candidate?: CandidateScore
  /** 선행 과제명 */
  dependsOn?: string
}

const SCENARIOS: Scenario[] = ['low', 'base', 'high']

/** 보조 지표 행 순서: 회수 기간 → 3년 순편익 → 1년 ROI (+ 연간 절감) */
const ROWS: { key: keyof ScenarioMetrics; label: string; format: (m: ScenarioMetrics) => string; help?: string }[] = [
  { key: 'paybackMonths', label: '회수 기간', format: (m) => formatMonths(m.paybackMonths) },
  { key: 'threeYearNetKrw', label: '3년 순편익', format: (m) => formatKrwShort(m.threeYearNetKrw) },
  { key: 'roiPct', label: '1년 ROI', format: (m) => formatPct(m.roiPct, 1), help: ROI_HELP },
  { key: 'annualSavingKrw', label: '연간 절감', format: (m) => formatKrwShort(m.annualSavingKrw) },
]

export function RoadmapItemCard({ item, candidate, dependsOn }: RoadmapItemCardProps) {
  // 로드맵 항목에는 부서명·솔루션 유형이 없어서 같은 후보에서 가져온다
  const solution = candidate?.solutionType ? (SOLUTION_LABEL[candidate.solutionType] ?? candidate.solutionType) : undefined
  // 후보 스냅샷이 아직 없으면 로드맵 항목의 기준 시나리오 값만 보여준다
  const base: ScenarioMetrics = {
    annualSavingKrw: item.expectedAnnualSavingKrw,
    roiPct: item.roiPct,
    paybackMonths: item.paybackMonths,
    threeYearNetKrw: item.threeYearNetValueKrw,
  }
  const columns: Scenario[] = candidate ? SCENARIOS : ['base']
  const metrics = (s: Scenario) => (candidate ? candidate.scenarios[s] : base)

  return (
    <article className="flex flex-col gap-3 rounded-lg bg-white/70 p-3.5">
      <header className="flex items-start gap-2.5">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white" aria-label={`우선순위 ${item.priorityOrder}`}>
          {item.priorityOrder}
        </span>
        <div className="min-w-0 space-y-1">
          <h4 className="text-[15px] leading-snug font-semibold">{item.itemName}</h4>
          <p className="text-[12px] text-muted">{[candidate?.departmentName, solution, `${PHASE_LABEL[item.phase]} 과제`].filter(Boolean).join(' · ')}</p>
          <ItemBadges
            humanReviewRequired={item.humanReviewRequired ?? candidate?.humanReviewRequired}
            dependsOn={dependsOn}
            warnings={candidate?.warnings}
            apiOk={candidate?.apiOk}
          />
        </div>
      </header>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] text-muted">AX점수</p>
          <p className="text-2xl font-semibold tracking-tight text-accent">{formatScore(item.axScore)}</p>
          <p className="text-[11px] text-muted">
            Impact {formatScore(item.impactScore)} · Feasibility {formatScore(item.feasibilityScore)}
          </p>
        </div>
        <p className="text-right text-[12px] text-muted">
          배정 예산
          <br />
          <span className="text-sm font-semibold text-ink">{formatKrwShort(item.allocatedBudgetKrw)}</span>
        </p>
      </div>

      <table className="w-full text-[12px]">
        <caption className="mb-1 text-left text-[11px] text-muted">보조 지표</caption>
        <thead>
          <tr className="text-[10px] text-muted">
            <th scope="col" className="sr-only">
              지표
            </th>
            {columns.map((s) => (
              <th key={s} scope="col" className="px-1 pb-0.5 text-right font-medium">
                {SCENARIO_LABEL[s]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key} className="border-t border-ink/6">
              <th scope="row" className="py-1 pr-1 text-left font-normal whitespace-nowrap text-muted">
                <span className="inline-flex items-center gap-1">
                  {row.label}
                  {row.help && <HelpIcon text={row.help} />}
                </span>
              </th>
              {columns.map((s) => (
                <td key={s} className={`px-1 py-1 text-right whitespace-nowrap ${s === 'base' ? 'font-semibold' : ''}`}>
                  {row.format(metrics(s))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-[13px] leading-relaxed">{item.rationale}</p>
      <EvidenceChips evidence={item.evidence} />
    </article>
  )
}
