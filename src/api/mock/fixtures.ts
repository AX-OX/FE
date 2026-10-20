import type { CandidateRoi, DocumentDetail, Maturity, RoadmapItem } from '@/types/task'

/**
 * Mock 데이터. ROI·회수기간은 §6 계산식으로 미리 계산해 둔 값이다 (프론트는 계산하지 않는다).
 * 처리량은 시연이 잘 보이도록 시드 예시보다 크게 잡았다 — 실제 값은 백엔드 시드를 따른다.
 */

export const BUDGET_KRW = 300_000_000

export const MATURITY: Maturity = {
  assessmentId: 1,
  scores: { data: 58, infra: 64, automation: 52, aiCapability: 38, governance: 45 },
  totalScore: 52.05,
  criteriaVersion: 'v1.0',
  insufficientData: [],
  evidence: [
    { area: 'data', documentId: 4, title: '데이터 품질 점검표', section: '2. 점검 결과', summary: '구매·영업 데이터 결측률 8% 이하, 고객 문의 이력은 분류 코드 누락이 많음' },
    { area: 'infra', documentId: 3, title: 'IT 시스템 명세서', section: '1. 시스템 목록', summary: 'ERP·CRM은 REST API 제공, 그룹웨어는 API 없음' },
    { area: 'automation', documentId: 1, title: '구매팀 업무 매뉴얼', section: '3. 견적 비교 절차', summary: '견적 수신부터 비교표 작성까지 수작업 엑셀 처리' },
    { area: 'aiCapability', documentId: 5, title: 'AI 활용 현황 보고', section: '요약', summary: '생성형 AI 개인 사용만 있고 조직 차원의 도입 사례 없음' },
    { area: 'governance', documentId: 6, title: '보안·데이터 정책', section: '4. 외부 서비스', summary: 'AI 서비스 사용 지침은 있으나 데이터 반출 승인 절차가 정의되지 않음' },
  ],
}

const c = (
  processId: number,
  departmentName: string,
  processName: string,
  solutionId: number,
  solutionType: string,
  solutionName: string,
  firstYearCostKrw: number,
  feasibilityScore: number,
  priority: number,
  s: [number, number, number | null][],
  selected = false,
): CandidateRoi => ({
  processId,
  departmentName,
  processName,
  solutionId,
  solutionType,
  solutionName,
  firstYearCostKrw,
  feasibilityScore,
  priority,
  selected,
  scenarios: {
    low: { annualSavingKrw: s[0][0], roiPct: s[0][1], paybackMonths: s[0][2] },
    base: { annualSavingKrw: s[1][0], roiPct: s[1][1], paybackMonths: s[1][2] },
    high: { annualSavingKrw: s[2][0], roiPct: s[2][1], paybackMonths: s[2][2] },
  },
})

export const CANDIDATES: CandidateRoi[] = [
  c(1, '구매', '협력사 견적 비교', 5, 'RPA', '반복 업무 자동화(RPA)', 33_400_000, 1, 0.966, [[82_080_000, 145.75, 4.1], [114_912_000, 244.05, 2.8], [153_216_000, 358.73, 2.1]], true),
  c(2, '구매', '발주서 등록', 5, 'RPA', '반복 업무 자동화(RPA)', 33_400_000, 0.8, 0.94, [[85_500_000, 155.99, 3.9], [119_700_000, 258.38, 2.7], [159_600_000, 377.84, 2.0]], true),
  c(10, '고객지원', '고객 문의 분류', 4, 'CLASSIFICATION', '문의·문서 자동 분류', 40_800_000, 1, 0.81, [[75_600_000, 85.29, 5.6], [105_840_000, 159.41, 3.8], [141_120_000, 245.88, 2.8]], true),
  c(1, '구매', '협력사 견적 비교', 2, 'AI_AGENT', '업무 처리 AI 에이전트', 99_000_000, 1, 0.474, [[54_720_000, -44.73, 29.3], [82_080_000, -17.09, 15.5], [114_912_000, 16.07, 9.9]]),
  c(10, '고객지원', '고객 문의 분류', 2, 'AI_AGENT', '업무 처리 AI 에이전트', 99_000_000, 1, 0.449, [[50_400_000, -49.09, 34.1], [75_600_000, -23.64, 17.4], [105_840_000, 6.91, 11.0]]),
  c(7, '인사', '사내 규정 문의 응답', 1, 'RAG', '사내 지식 검색(RAG)', 54_400_000, 1, 0.332, [[23_040_000, -57.65, 55.6], [34_560_000, -36.47, 23.8], [48_384_000, -11.06, 14.1]]),
  c(4, '영업', '영업 보고서 작성', 2, 'AI_AGENT', '업무 처리 AI 에이전트', 99_000_000, 0.6, 0.318, [[48_600_000, -50.91, 36.6], [72_900_000, -26.36, 18.4], [102_060_000, 3.09, 11.5]]),
  c(3, '구매', '납기 변경 확인', 3, 'PREDICTION', '수요·납기 예측', 78_000_000, 1, 0.3, [[20_520_000, -73.69, 285.7], [34_200_000, -56.15, 44.4], [51_300_000, -34.23, 21.6]]),
]

export const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    processId: 1,
    solutionId: 5,
    itemName: '협력사 견적 비교 자동화',
    priorityOrder: 1,
    phase: 'SHORT',
    startMonth: 1,
    durationMonths: 3,
    allocatedBudgetKrw: 33_400_000,
    expectedAnnualSavingKrw: 114_912_000,
    roiPct: 244.05,
    paybackMonths: 2.8,
    rationale:
      '월 3,000건을 건당 12분씩 엑셀로 비교하고 있어 반복성이 높습니다. ERP API로 견적 데이터를 바로 가져올 수 있고 승인 단계가 없어 가장 빨리 효과를 낼 수 있습니다.',
    evidence: [
      { documentId: 1, title: '구매팀 업무 매뉴얼', section: '3. 견적 비교 절차', summary: '협력사 견적 3건 이상을 엑셀 비교표로 수작업 정리' },
      { documentId: 3, title: 'IT 시스템 명세서', section: '2.1 ERP', summary: '견적·발주 모듈 REST API 제공' },
    ],
    processName: '협력사 견적 비교',
    departmentName: '구매',
    solutionType: 'RPA',
    solutionName: '반복 업무 자동화(RPA)',
  },
  {
    processId: 2,
    solutionId: 5,
    itemName: '발주서 등록 자동화',
    priorityOrder: 2,
    phase: 'SHORT',
    startMonth: 3,
    durationMonths: 3,
    allocatedBudgetKrw: 33_400_000,
    expectedAnnualSavingKrw: 119_700_000,
    roiPct: 258.38,
    paybackMonths: 2.7,
    rationale:
      '기준 ROI는 가장 높지만 팀장 승인 단계가 있어 실현 가능성 점수가 낮습니다. 승인 전까지의 입력 작업만 자동화하고 승인은 사람이 하도록 설계합니다.',
    evidence: [
      { documentId: 1, title: '구매팀 업무 매뉴얼', section: '4. 발주 등록', summary: '발주서는 팀장 승인 후 ERP에 등록' },
    ],
    processName: '발주서 등록',
    departmentName: '구매',
    solutionType: 'RPA',
    solutionName: '반복 업무 자동화(RPA)',
  },
  {
    processId: 10,
    solutionId: 4,
    itemName: '고객 문의 자동 분류',
    priorityOrder: 3,
    phase: 'MID',
    startMonth: 5,
    durationMonths: 4,
    allocatedBudgetKrw: 40_800_000,
    expectedAnnualSavingKrw: 105_840_000,
    roiPct: 159.41,
    paybackMonths: 3.8,
    rationale:
      '월 6,000건으로 처리량이 가장 많습니다. 다만 분류 코드 누락이 많아 첫 1개월은 학습 데이터 정비가 필요하므로 중기 과제로 배치했습니다.',
    evidence: [
      { documentId: 2, title: '고객지원 업무 매뉴얼', section: '2. 문의 접수·분류', summary: '상담원이 문의를 읽고 12개 유형 중 하나로 수동 분류' },
      { documentId: 4, title: '데이터 품질 점검표', section: '2. 점검 결과', summary: '고객 문의 이력의 분류 코드 누락률 23%' },
    ],
    processName: '고객 문의 분류',
    departmentName: '고객지원',
    solutionType: 'CLASSIFICATION',
    solutionName: '문의·문서 자동 분류',
  },
]

export const SUMMARY_TEXT = `분석을 마쳤습니다. 4개 부서 12개 업무와 5개 AI 솔루션을 조합해 **후보 8개**의 ROI를 계산했고, 예산 3억 원 안에서 우선순위 점수 합이 가장 높은 **3개 과제**를 골랐습니다.

1. **협력사 견적 비교 × RPA**: 기준 ROI 244%, 2.8개월이면 투자금 회수
2. **발주서 등록 × RPA**: 기준 ROI 258%, 승인 단계는 사람이 유지
3. **고객 문의 분류 × 자동 분류**: 처리량이 가장 많고, 데이터 정비 후 착수

세 과제의 1년 차 비용은 **1억 760만 원**으로 예산의 36%입니다. 현재 AX 성숙도는 52점이며, 특히 AI 활용 역량(38점)과 거버넌스(45점)가 낮습니다. 남은 예산은 이 두 영역을 보완하는 데 쓰는 것을 권합니다.

아래 로드맵을 검토한 뒤 승인해 주세요. 승인하면 로드맵과 프로젝트 3건이 등록됩니다.`

export const DOCUMENTS: Record<number, DocumentDetail> = {
  1: {
    documentId: 1,
    title: '구매팀 업무 매뉴얼',
    docType: 'MANUAL',
    version: 'v3',
    content: `# 구매팀 업무 매뉴얼

## 3. 견적 비교 절차
1. 협력사로부터 견적서를 메일로 받는다 (품목당 최소 3곳).
2. 견적서 금액·납기·결제 조건을 **엑셀 비교표**에 옮겨 적는다.
3. 최저가와 납기 조건을 비교해 추천 협력사를 표시한다.
4. 비교표를 ERP 견적 모듈에 첨부한다.

> 건당 평균 처리 시간은 약 12분이며, 금액 옮겨 적기 단계에서 오류가 가장 많다.

## 4. 발주 등록
- 발주서는 **팀장 승인 후** ERP에 등록한다.
- 5천만 원 이상 발주는 구매본부장 승인이 추가로 필요하다 (자동화 제외).`,
  },
  2: {
    documentId: 2,
    title: '고객지원 업무 매뉴얼',
    docType: 'MANUAL',
    version: 'v2',
    content: `# 고객지원 업무 매뉴얼

## 2. 문의 접수·분류
- 고객센터 솔루션으로 들어온 문의를 상담원이 읽고 **12개 유형** 중 하나로 분류한다.
- 분류 후 담당 부서로 이관한다. 잘못 분류하면 재이관에 평균 1일이 더 걸린다.
- 월 평균 문의량: 약 6,000건`,
  },
  3: {
    documentId: 3,
    title: 'IT 시스템 명세서',
    docType: 'SYSTEM_SPEC',
    version: 'v1',
    content: `# IT 시스템 명세서

## 1. 시스템 목록
| 시스템 | 유형 | API | 클라우드 |
|---|---|---|---|
| SAP ERP | ERP | 제공 | 아니오 |
| Salesforce | CRM | 제공 | 예 |
| 사내 그룹웨어 | GROUPWARE | 없음 | 아니오 |

## 2.1 ERP
견적·발주 모듈은 REST API를 제공한다. 조회는 OPEN, 등록은 RESTRICTED 권한.`,
  },
  4: {
    documentId: 4,
    title: '데이터 품질 점검표',
    docType: 'DATA_QUALITY',
    version: 'v1',
    content: `# 데이터 품질 점검표 (2026년 3분기)

## 2. 점검 결과
- 구매 데이터 결측률: 4%
- 영업 데이터 결측률: 8%
- 고객 문의 이력: **분류 코드 누락률 23%** — 자동 분류 학습 전 정비 필요`,
  },
  5: {
    documentId: 5,
    title: 'AI 활용 현황 보고',
    docType: 'AI_STATUS',
    version: 'v1',
    content: `# AI 활용 현황 보고

## 요약
- 직원 일부가 개인 계정으로 생성형 AI를 쓰고 있다.
- 조직 차원에서 도입한 AI 시스템은 없다.
- AI 관련 교육 이수자: 전체 직원의 6%`,
  },
  6: {
    documentId: 6,
    title: '보안·데이터 정책',
    docType: 'POLICY',
    version: 'v2',
    content: `# 보안·데이터 정책

## 4. 외부 서비스
- 외부 AI 서비스에 고객 개인정보를 입력하지 않는다.
- 데이터 반출 승인 절차는 **추후 정의 예정**이다.`,
  },
}
