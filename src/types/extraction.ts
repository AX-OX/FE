/**
 * 기업 데이터 추출 draft와 확정 요청 (BE `ExtractionDtos.Payload`).
 * 확정 전에는 DB ID가 없어서 key로 부서·업무·시스템을 잇는다. 확정은 회사당 한 번이다.
 */

/** 업무 유형. 같은 유형의 솔루션 템플릿과 매칭하며 OTHER는 추천 대상이 아니다 */
export type WorkType =
  | 'KNOWLEDGE_QA'
  | 'GUIDANCE'
  | 'DECISION_SUPPORT'
  | 'REPORT_AGGREGATION'
  | 'RESEARCH_REPORT'
  | 'MEETING_SUMMARY'
  | 'TICKET_TRIAGE'
  | 'CODE_REVIEW'
  | 'DOC_AUTHORING'
  | 'OTHER'

export type SystemType = 'ERP' | 'CRM' | 'GROUPWARE' | 'HR' | 'ETC'
export type DataAccessLevel = 'OPEN' | 'RESTRICTED' | 'NONE'

/** 추출 근거. page는 1부터 */
export interface ExtractionSource {
  documentId: number
  page: number | null
}

export interface ExtractedDepartment {
  key: string
  name: string
}

export interface ExtractedProcess {
  key: string
  departmentKey: string
  name: string
  purpose: string | null
  steps: string[] | null
  standardizationLevel: number | null
  requiresApproval: boolean
  exceptionRules: string | null
  workType: WorkType
  source: ExtractionSource | null
}

/** 업무당 월평균 1건. EXTRACTED = 문서 값 그대로, USER_INPUT = 사용자가 입력하거나 고침 */
export interface ExtractedMetric {
  processKey: string
  monthlyCount: number
  avgMinutes: number
  hourlyLaborCostKrw: number
  errorRate: number | null
  dataSource: 'EXTRACTED' | 'USER_INPUT'
  source: ExtractionSource | null
}

export interface ExtractedSystem {
  key: string
  name: string
  type: SystemType
  apiAvailable: boolean
  dataAccessLevel: DataAccessLevel
  cloudBased: boolean
  processKeys: string[]
}

export interface ExtractionPayload {
  company: { industry: string | null; employeeCount: number | null } | null
  departments: ExtractedDepartment[]
  processes: ExtractedProcess[]
  metrics: ExtractedMetric[]
  systems: ExtractedSystem[]
}

/** `GET /api/ai/tasks/{taskId}/extraction` */
export interface ExtractionDraft {
  draftId: number
  status: 'DRAFT' | 'CONFIRMED'
  documentIds: number[]
  payload: ExtractionPayload
}
