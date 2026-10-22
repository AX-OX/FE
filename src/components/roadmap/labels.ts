import type { SystemType, WorkType } from '@/types/extraction'
import type { AgentNode, DataConfidence, MaturityArea, Phase, Scenario } from '@/types/task'

export const NODE_LABEL: Record<AgentNode, string> = {
  extract: 'PDF에서 회사 데이터 추출',
  confirmation: '회사 데이터 확정',
  collect: '업무 데이터 수집',
  retrieve: '근거 문서 검색',
  assess: 'AX 성숙도 진단',
  discover: '후보 과제 발굴',
  evaluate: 'AX점수 계산·예산 조합 탐색',
  roadmap: '로드맵 작성',
  approval: '승인 대기',
  register: '로드맵·프로젝트 등록',
}

/** §6 성숙도 가중치 */
export const MATURITY_AREAS: { key: MaturityArea; label: string; weight: number }[] = [
  { key: 'data', label: '데이터 준비도', weight: 0.25 },
  { key: 'infra', label: 'IT 인프라', weight: 0.2 },
  { key: 'automation', label: '업무 자동화', weight: 0.2 },
  { key: 'aiCapability', label: 'AI 활용 역량', weight: 0.2 },
  { key: 'governance', label: 'AI 거버넌스', weight: 0.15 },
]

export const PHASE_LABEL: Record<Phase, string> = { SHORT: '단기', MID: '중기', LONG: '장기' }

export const SCENARIO_LABEL: Record<Scenario, string> = { low: '보수', base: '기준', high: '낙관' }

export const SOLUTION_LABEL: Record<string, string> = {
  RAG: 'RAG',
  AI_AGENT: 'AI 에이전트',
  PREDICTION: '예측',
  CLASSIFICATION: '분류',
  RPA: 'RPA',
}

/** §7 `warnings` 코드 */
export const WARNING_LABEL: Record<string, string> = {
  LOW_STANDARDIZATION: '표준화 낮음',
  INSUFFICIENT_METRICS: '지표 부족',
}

/** §7 portfolio.greedyTop3.violations */
export const VIOLATION_LABEL: Record<string, string> = {
  BUDGET_EXCEEDED: '예산 초과',
  MISSING_DEPENDENCY: '선행 과제 누락',
  DUPLICATE_PROCESS: '같은 업무 중복',
}

/** 데이터 신뢰도 — 점수에 넣지 않고 표시만 한다 */
export const DATA_CONFIDENCE_LABEL: Record<DataConfidence, string> = {
  MEASURED: '실측',
  SURVEY: '설문',
  EXTRACTED: '문서 추출',
  ASSUMED: '가정',
}

/** 업무 유형 — 같은 유형의 솔루션을 추천한다 */
export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  KNOWLEDGE_QA: '규정·지식 문의 응답',
  GUIDANCE: '안내·온보딩',
  DECISION_SUPPORT: '평가·의사결정 지원',
  REPORT_AGGREGATION: '보고 취합',
  RESEARCH_REPORT: '조사·리포트 작성',
  MEETING_SUMMARY: '회의록·액션 정리',
  TICKET_TRIAGE: '문의·티켓 분류',
  CODE_REVIEW: '코드 리뷰',
  DOC_AUTHORING: '기술 문서 작성',
  OTHER: '기타 (추천 대상 아님)',
}

export const SYSTEM_TYPE_LABEL: Record<SystemType, string> = {
  ERP: 'ERP',
  CRM: 'CRM',
  GROUPWARE: '그룹웨어',
  HR: '인사 시스템',
  ETC: '기타',
}

export const ROI_HELP = '초기 구축비가 반영돼 첫해에는 음수가 흔합니다. 회수 기간과 3년 순편익을 함께 보세요.'
