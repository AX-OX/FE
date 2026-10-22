import type { Turn } from '@/stores/chatStore'
import type { AxScoreResult } from '@/types/task'
import { CandidateTable } from './CandidateTable'
import { ExcludedList } from './ExcludedList'
import { MaturityCard } from './MaturityCard'
import { RoadmapItemCard } from './RoadmapItemCard'
import { RoadmapSummary } from './RoadmapSummary'
import { RoadmapTimeline } from './RoadmapTimeline'

function StatusBadge({ turn }: { turn: Turn }) {
  const approved = turn.decision?.decision === 'APPROVE'
  const [label, cls] =
    turn.status === 'REJECTED'
      ? ['거절됨', 'bg-ink/8 text-muted']
      : turn.status === 'DONE' && approved
        ? ['승인·등록 완료', 'bg-emerald-50 text-emerald-800 border-emerald-600/20']
        : approved
          ? ['승인됨 · 등록 중', 'bg-accent/10 text-accent']
          : ['승인 대기', 'bg-amber-50 text-amber-800 border-amber-600/20']
  return <span className={`shrink-0 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-semibold ${cls}`}>{label}</span>
}

/** AX 투자 로드맵 리포트 — APPROVAL_REQUIRED 데이터 + result 스냅샷 */
export function RoadmapReport({ turn }: { turn: Turn }) {
  const roadmap = turn.result?.roadmap
  const items = roadmap?.items ?? turn.approval?.items ?? []
  const totalAllocatedKrw = roadmap?.totalAllocatedKrw ?? turn.approval?.totalAllocatedKrw ?? 0
  // 예산 없는 요청은 null (예산 제약 없이 선정)
  const budgetKrw = roadmap ? roadmap.budgetLimitKrw : (turn.approval?.budgetKrw ?? null)
  const name = roadmap?.roadmapName ?? turn.approval?.roadmap.roadmapName ?? 'AX 투자 로드맵'
  // APPROVAL_REQUIRED만 먼저 오면 candidates·portfolio는 아직 없다
  const candidates = turn.result?.candidates ?? []
  const portfolio = turn.result?.portfolio
  const sorted = [...items].sort((a, b) => a.priorityOrder - b.priorityOrder)
  const assumedData = candidates.some((c) => c.dataConfidence === 'ASSUMED')
  const nameOfProcess = (processId: number) => candidates.find((c) => c.processId === processId)?.processName
  const findCandidate = (processId: number, solutionId: number) => candidates.find((c) => c.processId === processId && c.solutionId === solutionId)
  /**
   * 선행 과제명. 템플릿 하나가 여러 업무에 붙으므로 (dependsOnProcessId, dependsOnSolutionId) 쌍으로 찾는다.
   * dependsOnProcessId가 없는 이전 결과만 solutionId로 찾는다.
   */
  const dependencyName = (c: AxScoreResult) => {
    const solutionId = c.dependsOnSolutionId
    if (!solutionId) return undefined
    const processId = c.dependsOnProcessId
    const match = (x: { processId: number; solutionId: number }) => x.solutionId === solutionId && (processId == null || x.processId === processId)
    const candidate = candidates.find(match)
    return items.find(match)?.itemName ?? candidate?.processName ?? candidate?.solutionName ?? `솔루션 ${solutionId}`
  }

  return (
    <section className="glass space-y-3 p-3 sm:p-4" aria-label={name}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-muted">AX 투자 로드맵</p>
          <h3 className="text-lg font-semibold">{name}</h3>
        </div>
        <StatusBadge turn={turn} />
      </header>

      <RoadmapSummary itemCount={items.length} totalAllocatedKrw={totalAllocatedKrw} budgetKrw={budgetKrw} portfolio={portfolio} assumedData={assumedData} />
      <RoadmapTimeline items={items} />

      <div className="grid gap-3 md:grid-cols-3">
        {sorted.map((item) => {
          const candidate = findCandidate(item.processId, item.solutionId)
          return (
            <RoadmapItemCard
              key={`${item.processId}-${item.solutionId}`}
              item={item}
              candidate={candidate}
              dependsOn={candidate ? dependencyName(candidate) : undefined}
            />
          )
        })}
      </div>

      {turn.result?.maturity && <MaturityCard maturity={turn.result.maturity} />}
      {portfolio && <ExcludedList excluded={portfolio.excluded ?? []} warnings={portfolio.warnings ?? []} nameOfProcess={nameOfProcess} />}
      {candidates.length > 0 && <CandidateTable candidates={candidates} budgetKrw={budgetKrw} dependencyName={dependencyName} />}
    </section>
  )
}
