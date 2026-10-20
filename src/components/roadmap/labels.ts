import type { AgentNode, MaturityArea, Phase, Scenario } from '@/types/task'

export const NODE_LABEL: Record<AgentNode, string> = {
  collect: '업무 데이터 수집',
  retrieve: '근거 문서 검색',
  assess: 'AX 성숙도 진단',
  discover: '후보 과제 발굴',
  evaluate: 'ROI·예산 조합 평가',
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
