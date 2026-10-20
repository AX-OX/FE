/**
 * AX_NAVIGATOR_CONTEXT(기준 문서) §7·§8 공개 API · SSE 이벤트 타입. JSON 키는 camelCase.
 * SSE도 `Authorization: Bearer` 헤더로 인증한다 (fetch 스트리밍, src/api/sse.ts).
 *
 * Agent가 완성되기 전에는 result가 null이거나 일부 키·필드만 올 수 있다 → 표시용 필드는 선택값으로 두고 화면에서 대체 문구를 쓴다.
 *
 * 기준 문서에서 정해지지 않아 프론트가 정한 처리
 *  - 로드맵 항목(`RoadmapItem`)에는 부서명·솔루션 유형·선행 과제가 없다 → 같은 processId·solutionId의 candidates에서 찾아 표시
 *  - 거절은 종료 이벤트 없이 서버가 스트림을 닫는다 → 승인 API 202를 받으면 프론트가 REJECTED로 처리
 */

export type TaskStatus = 'QUEUED' | 'RUNNING' | 'WAITING_APPROVAL' | 'DONE' | 'FAILED' | 'REJECTED'

/** §10 Graph Node */
export type AgentNode = 'collect' | 'retrieve' | 'assess' | 'discover' | 'evaluate' | 'roadmap' | 'approval' | 'register'

export type Phase = 'SHORT' | 'MID' | 'LONG'
export type Scenario = 'low' | 'base' | 'high'

export interface Evidence {
  documentId: number
  title?: string
  section?: string
  summary?: string
}

/** `roadmap_items` 컬럼 (camelCase). APPROVAL_REQUIRED items에는 humanReviewRequired가 함께 온다 */
export interface RoadmapItem {
  itemId?: number
  processId: number
  solutionId: number
  itemName: string
  priorityOrder: number
  phase: Phase
  startMonth: number
  durationMonths: number
  allocatedBudgetKrw: number
  axScore: number
  impactScore: number
  feasibilityScore: number
  /** [보조] 기준 시나리오 */
  expectedAnnualSavingKrw: number
  roiPct: number
  paybackMonths: number | null
  threeYearNetValueKrw: number
  rationale: string
  evidence: Evidence[]
  humanReviewRequired?: boolean
}

export type DataConfidence = 'MEASURED' | 'SURVEY' | 'ASSUMED'

/** [보조 지표] 시나리오별 값 */
export interface ScenarioMetrics {
  annualSavingKrw: number
  roiPct: number
  paybackMonths: number | null
  threeYearNetKrw: number
}

/** §7 `/internal/ax/roi` 응답 (AX점수 + 보조 지표) */
export interface AxScoreResult {
  processId: number
  solutionId: number
  dependsOnSolutionId: number | null
  /** 선정 기준. Impact × 0.6 + Feasibility × 0.4 (0~100) */
  axScore: number
  impactScore: number
  feasibilityScore: number
  savedHoursBase: number
  apiOk: boolean
  humanReviewRequired: boolean
  /** 점수에 반영하지 않고 배지로만 표시 */
  dataConfidence: DataConfidence
  /** 예: LOW_STANDARDIZATION */
  warnings: string[]
  firstYearTcoKrw: number
  scenarios: Record<Scenario, ScenarioMetrics>
}

/** §8 `result.candidates[]` = `/internal/ax/roi` 응답 + 표시용 이름·선정 여부·근거 (Agent 완성 전 누락 대비) */
export interface CandidateScore extends AxScoreResult {
  processName?: string
  departmentName?: string
  solutionName?: string
  solutionType?: string
  selected?: boolean
  evidence?: Evidence[]
}

export interface ExcludedProcess {
  processId: number
  reason: string
  processName?: string
}

/** 최근 3개월 지표가 부족해 선정 가능 후보에서 뺀 후보 (code: INSUFFICIENT_METRICS) */
export interface PortfolioWarning {
  processId: number
  solutionId: number
  code: string
  missingMonths: string[]
}

/** greedyTop3 위반 사유 */
export type PortfolioViolation = 'BUDGET_EXCEEDED' | 'MISSING_DEPENDENCY' | (string & {})

/** §7 `/internal/ax/portfolio` 응답 (= `result.portfolio`) */
export interface Portfolio {
  insufficient: boolean
  budgetKrw: number
  totalAxScore: number
  totalFirstYearTcoKrw: number
  remainingBudgetKrw: number
  evaluatedCombinations: number
  validCombinations: number
  /** insufficient면 빈 배열. 화면은 candidates[].selected를 쓴다 */
  selected: AxScoreResult[]
  excluded?: ExcludedProcess[]
  warnings?: PortfolioWarning[]
  /** 설명용 2등 조합 */
  runnerUp: { solutionIds: number[]; totalAxScore: number } | null
  /** 설명용: AX점수 상위 3개를 그대로 골랐을 때 */
  greedyTop3: { solutionIds: number[]; totalAxScore: number; totalFirstYearTcoKrw: number; violations: PortfolioViolation[] } | null
}

export type MaturityArea = 'data' | 'infra' | 'automation' | 'aiCapability' | 'governance'

export interface Maturity {
  /** 5개 영역이 다 없으면 저장하지 않아 null */
  assessmentId?: number | null
  scores?: Partial<Record<MaturityArea, number>>
  totalScore?: number | null
  criteriaVersion?: string
  insufficientData?: string[]
  evidence?: (Evidence & { area: MaturityArea })[]
}

export interface Roadmap {
  /** 승인·등록 전에는 null */
  roadmapId?: number | null
  roadmapName: string
  budgetLimitKrw: number
  totalAllocatedKrw: number
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  items: RoadmapItem[]
}

export interface RegisteredProject {
  projectId: number
  itemId: number
  projectName: string
  ownerDepartmentId: number
  projectStatus: string
}

/** §8 `result.approval` — Spring이 승인 API에서 기록한다 */
export interface ApprovalRecord {
  decision: 'APPROVE' | 'REJECT'
  userId: number
  reason: string | null
  decidedAt: string
}

/** §8 `ai_tasks.result` 스냅샷 (`GET /api/ai/tasks/{taskId}`, DONE 이벤트) */
export interface TaskResult {
  maturity?: Maturity
  candidates?: CandidateScore[]
  portfolio?: Portfolio
  roadmap?: Roadmap
  projects?: RegisteredProject[]
  approval?: ApprovalRecord
}

export interface TaskDetail {
  taskId: string
  status: TaskStatus
  result: TaskResult | null
  traceUrl: string | null
}

export interface ApprovalRequiredData {
  roadmap: Omit<Roadmap, 'items'> | Roadmap
  items: RoadmapItem[]
  totalAllocatedKrw: number
  budgetKrw: number
}

interface EventBase<T extends string, D> {
  type: T
  taskId: string
  ts: string
  node?: AgentNode
  data: D
}

export type TaskEvent =
  | EventBase<'TOKEN', { text: string }>
  | EventBase<'TOOL_START', { tool: string; label: string }>
  | EventBase<'TOOL_END', { tool: string; label: string; ok: boolean }>
  | EventBase<'APPROVAL_REQUIRED', ApprovalRequiredData>
  | EventBase<'DONE', { result: TaskResult }>
  | EventBase<'FAILED', { message: string; traceUrl?: string }>

export interface ApprovalRequest {
  decision: 'APPROVE' | 'REJECT'
  reason?: string
}

export interface DocumentDetail {
  documentId: number
  title: string
  docType: string
  version: string
  /** 민감도 표시용 (검색 권한과 무관) */
  accessLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL'
  /** 마크다운 원문 (이메일·전화번호는 서버가 마스킹) */
  content: string
}

/** §8 `GET /api/ai/tasks?mine=true` 목록 항목 (최신순) */
export interface TaskSummary {
  taskId: string
  status: TaskStatus
  requestText: string
  createdAt: string
  completedAt: string | null
}
