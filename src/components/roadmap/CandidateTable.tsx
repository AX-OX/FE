import { useState } from 'react'
import { formatKrw, formatKrwShort, formatMonths, formatPct, formatScore } from '@/lib/format'
import type { CandidateScore, Scenario } from '@/types/task'
import { HelpIcon, ItemBadges } from './Badges'
import { ROI_HELP, SCENARIO_LABEL, SOLUTION_LABEL } from './labels'

interface CandidateTableProps {
  candidates: CandidateScore[]
  /** 요청에 예산이 없으면 null */
  budgetKrw: number | null
  /** 후보 → 선행 과제명 (선행 과제가 없으면 undefined) */
  dependencyName: (candidate: CandidateScore) => string | undefined
}

const SCENARIOS: Scenario[] = ['low', 'base', 'high']

/** 후보 전체 비교 — AX점수 내림차순. 보조 지표 3열만 시나리오 토글로 바꾼다 */
export function CandidateTable({ candidates, budgetKrw, dependencyName }: CandidateTableProps) {
  const [scenario, setScenario] = useState<Scenario>('base')
  const sorted = [...candidates].sort((a, b) => b.axScore - a.axScore)

  return (
    <details className="group rounded-lg bg-white/70 p-3.5">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-medium">
        후보 과제 전체 비교 ({candidates.length}개)
        <svg viewBox="0 0 16 16" className="size-4 text-muted transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <p className="mt-1 text-[11px] text-muted">AX점수 = Impact × 0.6 + Feasibility × 0.4 · 선정은 {budgetKrw === null ? '예산 제약 없이' : `예산 ${formatKrw(budgetKrw)} 안에서`} AX점수 합 최대 조합</p>

      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className="text-muted">보조 지표 시나리오</span>
        <div className="inline-flex rounded-md bg-ink/6 p-0.5" role="group" aria-label="보조 지표 시나리오">
          {SCENARIOS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={scenario === s}
              onClick={() => setScenario(s)}
              className={`rounded px-2 py-0.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${scenario === s ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            >
              {SCENARIO_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[860px] text-[12px]">
          <thead className="text-left text-[11px] text-muted">
            <tr>
              <th className="py-1.5 pr-2 font-medium">업무(부서)</th>
              <th className="py-1.5 pr-2 font-medium">솔루션</th>
              <th className="py-1.5 pr-2 text-right font-medium">AX점수</th>
              <th className="py-1.5 pr-2 text-right font-medium">Impact</th>
              <th className="py-1.5 pr-2 text-right font-medium">Feasibility</th>
              <th className="py-1.5 pr-2 text-right font-medium">1년 차 비용</th>
              <th className="py-1.5 pr-2 text-right font-medium">회수</th>
              <th className="py-1.5 pr-2 text-right font-medium">3년 순편익</th>
              <th className="py-1.5 pr-2 text-right font-medium">
                <span className="inline-flex items-center gap-1">
                  1년 ROI <HelpIcon text={ROI_HELP} />
                </span>
              </th>
              <th className="py-1.5 text-center font-medium">선정</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const m = c.scenarios[scenario]
              return (
                <tr key={`${c.processId}-${c.solutionId}`} className={`border-t border-ink/6 align-top ${c.selected ? 'font-medium' : 'text-muted'}`}>
                  <td className="py-1.5 pr-2">
                    <span>
                      {c.processName ?? `업무 ${c.processId}`} <span className="text-[10px] text-muted">{c.departmentName}</span>
                    </span>
                    <span className="mt-1 block font-normal">
                      <ItemBadges
                        humanReviewRequired={c.humanReviewRequired}
                        dependsOn={dependencyName(c)}
                        warnings={c.warnings}
                        apiOk={c.apiOk}
                      />
                    </span>
                  </td>
                  <td className="py-1.5 pr-2">{c.solutionType ? (SOLUTION_LABEL[c.solutionType] ?? c.solutionType) : (c.solutionName ?? `솔루션 ${c.solutionId}`)}</td>
                  <td className={`py-1.5 pr-2 text-right font-semibold ${c.selected ? 'text-accent' : ''}`}>{formatScore(c.axScore)}</td>
                  <td className="py-1.5 pr-2 text-right">{formatScore(c.impactScore)}</td>
                  <td className="py-1.5 pr-2 text-right">{formatScore(c.feasibilityScore)}</td>
                  <td className="py-1.5 pr-2 text-right">{formatKrwShort(c.firstYearTcoKrw)}</td>
                  <td className="py-1.5 pr-2 text-right whitespace-nowrap">{formatMonths(m.paybackMonths)}</td>
                  <td className="py-1.5 pr-2 text-right">{formatKrwShort(m.threeYearNetKrw)}</td>
                  <td className="py-1.5 pr-2 text-right">{formatPct(m.roiPct, 1)}</td>
                  <td className="py-1.5 text-center">{c.selected ? <span className="text-accent">✓<span className="sr-only">선정</span></span> : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </details>
  )
}
