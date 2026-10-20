/**
 * AX_NAVIGATOR_CONTEXT §8 공개 API · SSE 이벤트 타입.
 *
 * ⚠️ 계약 확인 필요 (문서에 형태가 정해지지 않은 부분 — 프론트가 임시로 가정한 모양)
 *  1. `ai_tasks.result` JSONB 구조 → 아래 `TaskResult`
 *  2. `APPROVAL_REQUIRED.data.items[]` 필드 → `roadmap_items` 컬럼을 camelCase로 + 표시용 이름(processName 등)
 *  3. 거절 후 종료 이벤트가 없음 → 승인 API 202를 받으면 프론트가 REJECTED로 처리
 * 모든 JSON 키는 Spring(Jackson) 기본값인 camelCase로 가정한다.
 *
 * 계약 변경: SSE도 `?token=` 쿼리 대신 `Authorization: Bearer` 헤더로 인증한다 (fetch 스트리밍, src/api/sse.ts).
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
  summary: string
}

/** `roadmap_items` 컬럼 (camelCase) + 화면 표시용 이름 */
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
  expectedAnnualSavingKrw: number
  roiPct: number
  paybackMonths: number | null
  rationale: string
  evidence: Evidence[]
  // 표시용 (계약 확인 필요)
  processName?: string
  departmentName?: string
  solutionType?: string
  solutionName?: string
}

export interface ScenarioRoi {
  annualSavingKrw: number
  roiPct: number
  paybackMonths: number | null
}

/** calculate_ax_roi 결과 + 우선순위 */
export interface CandidateRoi {
  processId: number
  processName: string
  departmentName: string
  solutionId: number
  solutionType: string
  solutionName: string
  firstYearCostKrw: number
  feasibilityScore: number
  priority: number
  selected: boolean
  scenarios: Record<Scenario, ScenarioRoi>
}

export type MaturityArea = 'data' | 'infra' | 'automation' | 'aiCapability' | 'governance'

export interface Maturity {
  assessmentId?: number
  scores: Partial<Record<MaturityArea, number>>
  totalScore: number
  criteriaVersion: string
  insufficientData: string[]
  evidence: (Evidence & { area: MaturityArea })[]
}

export interface Roadmap {
  roadmapId?: number
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

/** `ai_tasks.result` 스냅샷 (계약 확인 필요) */
export interface TaskResult {
  maturity?: Maturity
  candidates?: CandidateRoi[]
  roadmap?: Roadmap
  projects?: RegisteredProject[]
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
  version?: string
  content: string
}
