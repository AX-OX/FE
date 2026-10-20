import type { AgentNode, DataConfidence, MaturityArea, Phase, Scenario } from '@/types/task'

export const NODE_LABEL: Record<AgentNode, string> = {
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
}

/** §7 portfolio.greedyTop3.violations */
export const VIOLATION_LABEL: Record<string, string> = {
  BUDGET_EXCEEDED: '예산 초과',
  MISSING_DEPENDENCY: '선행 과제 누락',
}

/** 데이터 신뢰도 — 점수에 넣지 않고 표시만 한다 */
export const DATA_CONFIDENCE_LABEL: Record<DataConfidence, string> = {
  MEASURED: '실측',
  SURVEY: '설문',
  ASSUMED: '가정',
}

export const ROI_HELP = '초기 구축비가 반영돼 첫해에는 음수가 흔합니다. 회수 기간과 3년 순편익을 함께 보세요.'
