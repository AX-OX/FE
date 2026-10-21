import type { CandidateScore, DocumentDetail, Evidence, Maturity, Portfolio, RoadmapItem, Scenario, ScenarioMetrics } from '@/types/task'

/**
 * 형식 확인용 임시값. 데이터 패키지 v3 fixtures/02_demo_waiting_approval.sql의 ai_tasks.result로 교체 예정.
 *
 * 숫자는 기준 문서 §6 계산식으로 미리 맞춰 둔 서버 응답 흉내다 (프론트는 계산하지 않는다).
 * - AX점수 = Impact × 0.6 + Feasibility × 0.4, Impact 최댓값 100 (장애 티켓 분류)
 * - 선정 3개 = 예산 3억·선행 조건을 만족하는 조합 중 AX점수 합 최대.
 *   점수 상위 3개(장애 티켓·코드 리뷰·사내 규정)는 1년 차 비용 3억 6,560만 원으로 예산 초과.
 * - 업무 지표는 전부 ASSUMED
 */

export const BUDGET_KRW = 300_000_000
export const ROADMAP_NAME = '2027 AX 투자 로드맵 (예산 3억 원)'

/** 부서명 → department_id (101 인사 / 102 기획 / 103 개발). 프로젝트 담당 부서 매핑용 */
export const DEPARTMENT_ID: Record<string, number> = { 인사: 101, 기획: 102, 개발: 103 }

const EV = {
  hrRules: { documentId: 401, title: '인사팀 업무 매뉴얼', section: '2. 사내 규정 문의 응답', summary: '휴가·복리후생 등 규정 문의를 월 900건 메일·메신저로 받아 규정집을 찾아 답변' },
  hrOnboarding: { documentId: 401, title: '인사팀 업무 매뉴얼', section: '3. 신규 입사자 온보딩', summary: '입사자마다 같은 안내(계정·장비·규정)를 담당자가 1:1로 반복 설명' },
  devReview: { documentId: 403, title: '개발팀 업무 매뉴얼', section: '3. 코드 리뷰', summary: 'PR 월 1,000건, 리뷰어 1인 이상 승인 후 병합 (병합 승인은 사람만)' },
  devTicket: { documentId: 403, title: '개발팀 업무 매뉴얼', section: '2. 장애 티켓 분류·배정', summary: '당번이 월 1,500건을 읽고 담당 팀에 수동 배정' },
  systems: { documentId: 405, title: 'IT 시스템 명세서', section: '1. 시스템 목록', summary: 'HRIS·이슈 트래커·코드 저장소·사내 위키는 API 제공, 그룹웨어는 API 없음' },
  report: { documentId: 408, title: '과거 프로젝트 보고서', section: '3. 교훈', summary: '사내 챗봇 PoC에서 규정 문서 정비가 선행돼야 답변 품질이 나왔음' },
} satisfies Record<string, Evidence>

export const MATURITY: Maturity = {
  assessmentId: 701,
  scores: { data: 55, infra: 68, automation: 48, aiCapability: 42, governance: 50 },
  totalScore: 52.85,
  criteriaVersion: 'v1',
  insufficientData: [],
  evidence: [
    { area: 'data', documentId: 407, title: '데이터 품질 점검표', section: '2. 점검 결과', summary: '업무 지표가 모두 추정값이고, 장애 티켓 분류 코드 누락률 12%' },
    { area: 'infra', documentId: 405, title: 'IT 시스템 명세서', section: '1. 시스템 목록', summary: 'HRIS·이슈 트래커·코드 저장소·위키는 API 제공, 그룹웨어는 API 없음' },
    { area: 'automation', documentId: 402, title: '기획팀 업무 매뉴얼', section: '2. 주간 업무 보고 취합', summary: '팀별 보고를 메일로 받아 수작업으로 한 문서에 취합' },
    { area: 'aiCapability', documentId: 406, title: 'AI 활용 현황 보고', section: '요약', summary: '개발팀 일부만 코드 보조 도구를 개인적으로 사용, 조직 차원 도입 사례 없음' },
    { area: 'governance', documentId: 404, title: '보안·데이터 정책', section: '4. AI 활용', summary: '사람에 대한 평가·채용 판단을 AI에 맡기지 않는다는 원칙만 있고 세부 승인 절차는 없음' },
  ],
}

type Row = [annualSavingKrw: number, roiPct: number, paybackMonths: number | null, threeYearNetKrw: number]

const scenarios = (low: Row, base: Row, high: Row): Record<Scenario, ScenarioMetrics> => {
  const m = ([annualSavingKrw, roiPct, paybackMonths, threeYearNetKrw]: Row) => ({ annualSavingKrw, roiPct, paybackMonths, threeYearNetKrw })
  return { low: m(low), base: m(base), high: m(high) }
}

const candidate = (c: Omit<CandidateScore, 'dataConfidence' | 'dependsOnSolutionId' | 'warnings' | 'apiOk' | 'humanReviewRequired' | 'selected' | 'evidence'> & Partial<CandidateScore>): CandidateScore => ({
  dependsOnSolutionId: null,
  evidence: [],
  apiOk: true,
  humanReviewRequired: false,
  dataConfidence: 'ASSUMED',
  warnings: [],
  selected: false,
  ...c,
})

export const CANDIDATES: CandidateScore[] = [
  candidate({
    processId: 207, solutionId: 507, processName: '장애 티켓 분류·배정', departmentName: '개발', solutionType: 'CLASSIFICATION', solutionName: '장애 티켓 자동 분류·배정',
    axScore: 96.4, impactScore: 100, feasibilityScore: 91, savedHoursBase: 3360, firstYearTcoKrw: 206_000_000,
    scenarios: scenarios([120_960_000, -41.28, 24, 84_880_000], [161_280_000, -21.71, 16.3, 205_840_000], [207_360_000, 0.66, 11.9, 344_080_000]),
    evidence: [EV.devTicket],
  }),
  candidate({
    processId: 208, solutionId: 508, processName: '코드 리뷰 보조', departmentName: '개발', solutionType: 'AI_AGENT', solutionName: '코드 리뷰 보조 에이전트',
    axScore: 75.1, impactScore: 62.5, feasibilityScore: 94, savedHoursBase: 2100, firstYearTcoKrw: 90_000_000, humanReviewRequired: true, selected: true,
    scenarios: scenarios([78_000_000, -13.33, 15, 84_000_000], [109_200_000, 21.33, 9.1, 177_600_000], [145_600_000, 61.78, 6.2, 286_800_000]),
    evidence: [EV.devReview],
  }),
  candidate({
    processId: 201, solutionId: 501, processName: '사내 규정 문의 응답', departmentName: '인사', solutionType: 'RAG', solutionName: '사내 규정 Q&A 검색',
    axScore: 64.5, impactScore: 48.8, feasibilityScore: 88, savedHoursBase: 1638, firstYearTcoKrw: 69_600_000, selected: true,
    scenarios: scenarios([42_768_000, -38.55, 27.2, 15_504_000], [58_968_000, -15.28, 15.4, 64_104_000], [77_760_000, 11.72, 10.3, 120_480_000]),
    evidence: [EV.hrRules],
  }),
  candidate({
    processId: 202, solutionId: 502, dependsOnSolutionId: 501, processName: '신규 입사자 온보딩 안내', departmentName: '인사', solutionType: 'AI_AGENT', solutionName: '온보딩 안내 에이전트',
    axScore: 50.1, impactScore: 26.8, feasibilityScore: 85, savedHoursBase: 900, firstYearTcoKrw: 64_400_000, selected: true,
    scenarios: scenarios([21_600_000, -66.46, 83.3, -28_400_000], [32_400_000, -49.69, 33.3, 4_000_000], [45_360_000, -29.57, 19.4, 42_880_000]),
    evidence: [EV.hrOnboarding],
  }),
  candidate({
    processId: 209, solutionId: 509, processName: '기술·API 문서 작성', departmentName: '개발', solutionType: 'AI_AGENT', solutionName: 'API 문서 초안 생성',
    axScore: 47.6, impactScore: 24.6, feasibilityScore: 82, savedHoursBase: 828, firstYearTcoKrw: 57_000_000,
    scenarios: scenarios([29_900_000, -47.54, 30.2, 8_700_000], [43_056_000, -24.46, 17.4, 48_168_000], [58_604_000, 2.81, 11.6, 94_812_000]),
  }),
  candidate({
    processId: 204, solutionId: 504, processName: '주간 업무 보고 취합', departmentName: '기획', solutionType: 'AI_AGENT', solutionName: '주간 보고 자동 취합',
    axScore: 45.8, impactScore: 25.7, feasibilityScore: 76, savedHoursBase: 864, firstYearTcoKrw: 52_400_000,
    scenarios: scenarios([25_200_000, -51.91, 42.2, -5_600_000], [36_288_000, -30.75, 20.8, 27_664_000], [49_392_000, -5.74, 13, 66_976_000]),
  }),
  candidate({
    processId: 206, solutionId: 506, processName: '회의록 작성·액션 아이템 정리', departmentName: '기획', solutionType: 'AI_AGENT', solutionName: '회의록 요약·액션 추출',
    axScore: 43.7, impactScore: 32.1, feasibilityScore: 61, savedHoursBase: 1080, firstYearTcoKrw: 47_000_000, warnings: ['LOW_STANDARDIZATION'],
    scenarios: scenarios([31_500_000, -32.98, 21.5, 23_500_000], [45_360_000, -3.49, 12.6, 65_080_000], [61_740_000, 31.36, 8.4, 114_220_000]),
  }),
  candidate({
    processId: 205, solutionId: 505, processName: '시장·경쟁사 동향 리포트 작성', departmentName: '기획', solutionType: 'RAG', solutionName: '동향 리포트 초안 생성',
    axScore: 15.3, impactScore: 9.5, feasibilityScore: 24, savedHoursBase: 320, firstYearTcoKrw: 79_000_000, apiOk: false,
    scenarios: scenarios([8_064_000, -89.79, null, -102_808_000], [13_440_000, -82.99, null, -86_680_000], [20_160_000, -74.48, null, -66_520_000]),
  }),
]

export const PORTFOLIO: Portfolio = {
  insufficient: false,
  budgetKrw: BUDGET_KRW,
  totalAxScore: 189.7,
  totalFirstYearTcoKrw: 224_000_000,
  remainingBudgetKrw: 76_000_000,
  evaluatedCombinations: 56,
  validCombinations: 25,
  // 실제 응답은 표시용 필드가 없는 /internal/ax/roi 형식이다
  selected: CANDIDATES.filter((c) => c.selected),
  excluded: [{ processId: 203, processName: '인사평가 등급 산정', reason: '사람에 대한 최종 평가를 AI가 결정하게 됨' }],
  runnerUp: { solutionIds: [501, 508, 509], totalAxScore: 187.2 },
  greedyTop3: { solutionIds: [507, 508, 501], totalAxScore: 236, totalFirstYearTcoKrw: 365_600_000, violations: ['BUDGET_EXCEEDED'] },
}

/** 우선순위 = AX점수 순, 선행 과제(사내 규정 Q&A)가 온보딩 에이전트보다 먼저 */
export const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    processId: 208,
    solutionId: 508,
    itemName: '코드 리뷰 보조 에이전트',
    priorityOrder: 1,
    phase: 'SHORT',
    startMonth: 1,
    durationMonths: 4,
    allocatedBudgetKrw: 90_000_000,
    axScore: 75.1,
    impactScore: 62.5,
    feasibilityScore: 94,
    expectedAnnualSavingKrw: 109_200_000,
    roiPct: 21.33,
    paybackMonths: 9.1,
    threeYearNetValueKrw: 177_600_000,
    humanReviewRequired: true,
    rationale:
      'AX점수 75.1로 선정 가능 후보 중 2위입니다. 월 1,000건의 PR 리뷰로 절감 시간이 커 Impact 62.5, 리뷰 절차가 표준화돼 있고 코드 저장소 API를 쓸 수 있어 Feasibility 94입니다. AI는 리뷰 의견만 제안하고 병합 승인은 지금처럼 리뷰어가 합니다.',
    evidence: [EV.devReview, EV.systems],
  },
  {
    processId: 201,
    solutionId: 501,
    itemName: '사내 규정 Q&A 검색',
    priorityOrder: 2,
    phase: 'SHORT',
    startMonth: 1,
    durationMonths: 3,
    allocatedBudgetKrw: 69_600_000,
    axScore: 64.5,
    impactScore: 48.8,
    feasibilityScore: 88,
    expectedAnnualSavingKrw: 58_968_000,
    roiPct: -15.28,
    paybackMonths: 15.4,
    threeYearNetValueKrw: 64_104_000,
    rationale:
      'AX점수 64.5입니다. 반복 문의가 많아 Impact 48.8, 규정집이 정리돼 있어 Feasibility 88입니다. 3번 온보딩 안내 에이전트가 이 검색 기반을 그대로 쓰므로 먼저 구축합니다. 1년 ROI는 구축비 때문에 음수지만 15.4개월이면 회수됩니다.',
    evidence: [EV.hrRules, EV.report],
  },
  {
    processId: 202,
    solutionId: 502,
    itemName: '온보딩 안내 에이전트',
    priorityOrder: 3,
    phase: 'MID',
    startMonth: 4,
    durationMonths: 4,
    allocatedBudgetKrw: 64_400_000,
    axScore: 50.1,
    impactScore: 26.8,
    feasibilityScore: 85,
    expectedAnnualSavingKrw: 32_400_000,
    roiPct: -49.69,
    paybackMonths: 33.3,
    threeYearNetValueKrw: 4_000_000,
    rationale:
      'AX점수 50.1입니다. 절감 시간은 작지만(Impact 26.8) HRIS API로 입사 정보를 바로 가져올 수 있어 Feasibility 85입니다. 사내 규정 Q&A 검색이 끝난 4월에 착수합니다. 1년 ROI는 −49.7%로 낮으니 3년 순편익과 함께 판단해 주세요.',
    evidence: [EV.hrOnboarding, EV.systems],
  },
]

export const SUMMARY_TEXT = `분석을 마쳤습니다. 인사·기획·개발 **3개 부서 9개 업무**를 살펴봤고, 사람에 대한 최종 평가를 AI가 하게 되는 **인사평가 등급 산정 1건은 제외**했습니다. 나머지 **후보 8개**의 AX점수(Impact × 0.6 + Feasibility × 0.4)를 계산해, 예산 3억 원 안에서 **AX점수 합이 가장 높은 3개**를 골랐습니다.

1. **코드 리뷰 보조 에이전트** (AX점수 75.1): 리뷰 시간이 많이 들고 절차·API 조건이 좋습니다. 병합 승인은 사람이 그대로 합니다.
2. **사내 규정 Q&A 검색** (64.5): 인사팀 반복 문의를 줄이고, 3번 과제의 선행 과제입니다.
3. **온보딩 안내 에이전트** (50.1): 2번의 검색 기반을 이어 쓰므로 함께 선정했습니다.

AX점수만 보면 장애 티켓 분류·배정(96.4)이 1위지만, 1년 차 비용이 2억 600만 원이라 어떤 3개 조합에 넣어도 예산을 넘습니다.

세 과제의 1년 차 투자는 **2억 2,400만 원**, 남은 예산은 7,600만 원입니다. 1년 ROI는 구축비가 반영돼 2·3번이 음수지만 보조 지표이므로 회수 기간과 3년 순편익을 함께 봐 주세요. 업무 지표가 모두 가정값이라 실측 후 다시 계산하는 것을 권합니다.

아래 로드맵을 검토한 뒤 승인해 주세요. 승인하면 로드맵과 프로젝트 3건이 등록됩니다.`

export const DOCUMENTS: Record<number, DocumentDetail> = {
  401: {
    documentId: 401,
    title: '인사팀 업무 매뉴얼',
    docType: 'MANUAL',
    version: 'v2',
    accessLevel: 'INTERNAL',
    content: `# 인사팀 업무 매뉴얼

## 2. 사내 규정 문의 응답
- 휴가·복리후생·출장 규정 문의를 메일과 메신저로 받는다 (월 평균 약 900건).
- 담당자가 규정집에서 해당 조항을 찾아 답변한다. 건당 평균 20분.
- 같은 질문이 반복되는 비율이 높다.

## 3. 신규 입사자 온보딩
- 입사 첫 주에 계정 발급, 장비 지급, 주요 규정을 담당자가 1:1로 안내한다.
- 입사자 정보는 HRIS에서 확인한다.

## 4. 인사평가 등급 산정
- 평가 등급은 **평가위원회가 최종 결정**한다. 자동화 대상이 아니다.`,
  },
  402: {
    documentId: 402,
    title: '기획팀 업무 매뉴얼',
    docType: 'MANUAL',
    version: 'v1',
    accessLevel: 'INTERNAL',
    content: `# 기획팀 업무 매뉴얼

## 2. 주간 업무 보고 취합
- 매주 금요일 팀별 보고를 메일로 받아 한 문서로 취합한다.
- 팀마다 양식이 조금씩 달라 옮겨 적는 데 시간이 걸린다.

## 3. 시장·경쟁사 동향 리포트
- 외부 기사·보고서를 모아 월 1회 리포트를 쓴다. 자료는 그룹웨어 게시판에만 올라온다.

## 4. 회의록 작성
- 회의 주관자가 자유 양식으로 작성한다. **정해진 양식이 없다.**`,
  },
  403: {
    documentId: 403,
    title: '개발팀 업무 매뉴얼',
    docType: 'MANUAL',
    version: 'v3',
    accessLevel: 'INTERNAL',
    content: `# 개발팀 업무 매뉴얼

## 2. 장애 티켓 분류·배정
- 이슈 트래커로 들어온 장애 티켓을 당번이 읽고 담당 팀에 배정한다 (월 약 1,500건, 건당 20분).

## 3. 코드 리뷰
- 모든 PR은 **리뷰어 1인 이상 승인 후** 병합한다 (월 약 1,000건).
- 병합 승인은 사람만 할 수 있다.

## 4. 기술·API 문서
- API를 바꾸면 사내 위키의 명세를 직접 갱신한다.`,
  },
  404: {
    documentId: 404,
    title: '보안·데이터 정책',
    docType: 'POLICY',
    version: 'v2',
    accessLevel: 'CONFIDENTIAL',
    content: `# 보안·데이터 정책

## 3. 개인정보
- 직원 연락처·평가 정보는 외부 서비스에 입력하지 않는다.

## 4. AI 활용
- 사람에 대한 평가·채용 판단을 AI에 맡기지 않는다.
- AI 도입 시 승인 절차는 **추후 정의 예정**이다.`,
  },
  405: {
    documentId: 405,
    title: 'IT 시스템 명세서',
    docType: 'SYSTEM_SPEC',
    version: 'v1',
    accessLevel: 'INTERNAL',
    content: `# IT 시스템 명세서

## 1. 시스템 목록
| 시스템 | 유형 | API | 클라우드 |
|---|---|---|---|
| HRIS | HR | 제공 | 예 |
| 그룹웨어 | GROUPWARE | 없음 | 아니오 |
| 이슈 트래커 | ETC | 제공 | 예 |
| 코드 저장소 | ETC | 제공 | 아니오 |
| 사내 위키 | ETC | 제공 | 아니오 |
| ERP | ERP | 제공 | 아니오 |`,
  },
  406: {
    documentId: 406,
    title: 'AI 활용 현황 보고',
    docType: 'AI_STATUS',
    version: 'v1',
    accessLevel: 'PUBLIC',
    content: `# AI 활용 현황 보고

## 요약
- 개발팀 일부가 개인 계정으로 코드 보조 도구를 쓰고 있다.
- 조직 차원에서 도입한 AI 시스템은 없다.`,
  },
  407: {
    documentId: 407,
    title: '데이터 품질 점검표',
    docType: 'DATA_QUALITY',
    version: 'v1',
    accessLevel: 'INTERNAL',
    content: `# 데이터 품질 점검표 (2026년 3분기)

## 2. 점검 결과
- 업무 처리량·처리 시간은 **실측이 아닌 담당자 추정값**이다.
- 장애 티켓 분류 코드 누락률: 12%
- 사내 규정집: 최신 개정본 반영 완료`,
  },
  408: {
    documentId: 408,
    title: '과거 프로젝트 보고서',
    docType: 'PROJECT_REPORT',
    version: 'v1',
    accessLevel: 'CONFIDENTIAL',
    content: `# 과거 프로젝트 보고서 — 사내 챗봇 PoC (2025)

## 3. 교훈
- 규정 문서를 먼저 정비해야 답변 품질이 나왔다.
- 답변 근거 문서를 함께 보여 줘야 직원들이 신뢰했다.`,
  },
}
