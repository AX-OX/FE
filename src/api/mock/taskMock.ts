import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import type { AgentNode, ApprovalRequest, DocumentDetail, TaskDetail, TaskEvent, TaskResult, TaskStatus, TaskSummary } from '@/types/task'
import type { ExtractionDraft, ExtractionPayload } from '@/types/extraction'
import { indexedUploads, uploadedDocument } from './documentMock'
import { BUDGET_KRW, CANDIDATES, DEPARTMENT_ID, DOCUMENTS, MATURITY, PORTFOLIO, ROADMAP_ITEMS, ROADMAP_NAME, SUMMARY_TEXT } from './fixtures'

/**
 * 백엔드 없이 §8 이벤트 흐름(TOOL → TOKEN → APPROVAL_REQUIRED → 승인 → DONE)을 흉내 낸다.
 * - 작업을 만든 사용자가 아니면 조회·스트림·승인 모두 403
 * - 요청 문구에 '실패'가 들어가면 evaluate 단계에서 FAILED
 * - '진단'이 들어가면 추천 과제 없이 성숙도 진단만으로 DONE (로드맵 null, 답변은 result.answer)
 * - '예산'·'억'이 없으면 예산 제약 없이 선정 (budgetKrw·remainingBudgetKrw null)
 * - 데모 계정이 아닌 계정(새 회사)은 첫 작업에서 PDF 추출 → CONFIRMATION_REQUIRED → 확정 후 분석을 이어간다.
 *   읽기가 끝난 업로드 PDF가 없으면 FAILED. 확정은 계정당 한 번이다
 * - 작업은 메모리에만 있어서 새로고침하면 이력이 사라진다
 */

type Listener = (e: TaskEvent) => void
type Step = [delayMs: number, make: () => TaskEvent]

interface MockTask {
  ownerId: number | undefined
  requestText: string
  createdAt: string
  completedAt: string | null
  failing: boolean
  assessmentOnly: boolean
  /** 요청에 예산이 없으면 null */
  budgetKrw: number | null
  status: TaskStatus
  result: TaskResult | null
  traceUrl: string | null
  listeners: Set<Listener>
  timers: number[]
  started: boolean
  draft?: ExtractionDraft
}

const tasks = new Map<string, MockTask>()
/** 기업 데이터를 확정한 사용자 (데모 계정은 시드 데이터가 있어 처음부터 확정) */
const confirmedOwners = new Set<number | undefined>([1])
const TRACE_URL = 'https://smith.langchain.com/mock-trace'
// 서버가 준 값이라고 가정 (프론트에서 합산하지 않는다)
const totalAllocated = PORTFOLIO.totalFirstYearTcoKrw

const currentUserId = () => useAuthStore.getState().user?.userId

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function find(taskId: string): MockTask {
  const task = tasks.get(taskId)
  if (!task) throw new ApiError(404, { code: 'NOT_FOUND', message: '작업을 찾을 수 없습니다.' })
  if (task.ownerId !== currentUserId()) throw new ApiError(403, { code: 'FORBIDDEN', message: '작업을 요청한 본인만 볼 수 있어요.' })
  return task
}

function emit(taskId: string, event: Omit<TaskEvent, 'taskId' | 'ts'>): TaskEvent {
  return { ...event, taskId, ts: new Date().toISOString() } as TaskEvent
}

function tool(taskId: string, node: AgentNode, name: string, label: string, gap = 450): Step[] {
  return [
    [gap, () => emit(taskId, { type: 'TOOL_START', node, data: { tool: name, label } })],
    [500, () => emit(taskId, { type: 'TOOL_END', node, data: { tool: name, label, ok: true } })],
  ]
}

function tokens(taskId: string, text: string): Step[] {
  // 2~4글자씩 끊어서 스트리밍
  const chunks = text.match(/[\s\S]{1,3}/g) ?? []
  return chunks.map((chunk) => [18, () => emit(taskId, { type: 'TOKEN', node: 'roadmap', data: { text: chunk } })] as Step)
}

function run(task: MockTask, steps: Step[]) {
  let at = 0
  for (const [delay, make] of steps) {
    at += delay
    task.timers.push(
      window.setTimeout(() => {
        const event = make()
        if (event.type === 'APPROVAL_REQUIRED') task.status = 'WAITING_APPROVAL'
        if (event.type === 'CONFIRMATION_REQUIRED') task.status = 'WAITING_CONFIRMATION'
        if (event.type === 'DONE') task.status = 'DONE'
        if (event.type === 'FAILED') task.status = 'FAILED'
        if (event.type === 'DONE' || event.type === 'FAILED') task.completedAt = event.ts
        task.listeners.forEach((l) => l(event))
      }, at),
    )
  }
}

/** 미확정 회사: 업로드 PDF에서 추출 → draft 저장 → 확정 대기 */
function extractionSteps(taskId: string, task: MockTask): Step[] {
  const documents = indexedUploads()
  if (!documents.length) {
    return [
      [600, () => emit(taskId, { type: 'FAILED', node: 'extract', data: { message: 'INSUFFICIENT_DATA: 기업 데이터를 추출할 PDF를 먼저 업로드해 주세요.' } })],
    ]
  }
  return [
    ...tool(taskId, 'extract', 'rag_get_document_chunks', '올린 PDF 읽는 중', 300),
    ...tool(taskId, 'extract', 'business_save_extraction', '추출한 회사 데이터 저장 중', 900),
    [
      300,
      () => {
        task.draft = mockDraft(documents.map((d) => d.documentId))
        return emit(taskId, { type: 'CONFIRMATION_REQUIRED', node: 'confirmation', data: { draftId: task.draft.draftId } })
      },
    ],
  ]
}

let nextDraftId = 7001

/** 업무 2개(지표는 1개만), 시스템 1개. 지표가 없는 업무와 유형 수정 화면을 확인하기 위한 값 */
function mockDraft(documentIds: number[]): ExtractionDraft {
  const source = { documentId: documentIds[0], page: 1 }
  return {
    draftId: nextDraftId++,
    status: 'DRAFT',
    documentIds,
    payload: {
      company: { industry: null, employeeCount: null },
      departments: [{ key: 'd1', name: '인사팀' }],
      processes: [
        { key: 'p1', departmentKey: 'd1', name: '사내 규정 문의 응답', purpose: '반복되는 규정 문의에 답한다', steps: [], standardizationLevel: null, requiresApproval: false, exceptionRules: null, workType: 'KNOWLEDGE_QA', source },
        { key: 'p2', departmentKey: 'd1', name: '전자 결재 처리', purpose: null, steps: [], standardizationLevel: null, requiresApproval: true, exceptionRules: null, workType: 'OTHER', source: { documentId: documentIds[0], page: 2 } },
      ],
      metrics: [{ processKey: 'p1', monthlyCount: 120, avgMinutes: 15, hourlyLaborCostKrw: 35000, errorRate: null, dataSource: 'EXTRACTED', source }],
      systems: [{ key: 's1', name: '그룹웨어', type: 'GROUPWARE', apiAvailable: false, dataAccessLevel: 'RESTRICTED', cloudBased: false, processKeys: ['p2'] }],
    },
  }
}

function analysisSteps(taskId: string, task: MockTask): Step[] {
  return [
    ...tool(taskId, 'collect', 'business_get_company_profile', '기업 정보 조회 중', 300),
    ...tool(taskId, 'collect', 'business_get_business_processes', '업무 프로세스 조회 중'),
    ...tool(taskId, 'collect', 'business_get_operational_metrics', '업무 지표 조회 중'),
    ...tool(taskId, 'collect', 'business_get_system_inventory', 'IT 시스템 조회 중'),
    ...tool(taskId, 'collect', 'business_get_project_budget', 'AX 예산 조회 중'),
    ...tool(taskId, 'retrieve', 'rag_search_docs', '업무 매뉴얼 검색 중'),
    ...tool(taskId, 'retrieve', 'rag_search_docs', '시스템 명세·데이터 품질 문서 검색 중'),
    ...tool(taskId, 'assess', 'business_save_assessment', '성숙도 진단 결과 저장 중', 700),
    ...tool(taskId, 'discover', 'business_get_solution_candidates', '솔루션 후보 조회 중'),
    ...(task.assessmentOnly
      ? assessmentSteps(taskId, task)
      : [
          ...tool(taskId, 'evaluate', 'business_calculate_ax_roi', '후보 8개 AX점수 계산 중'),
          ...(task.failing ? failSteps(taskId, task) : evaluateRest(taskId, task)),
        ]),
  ]
}

const ASSESSMENT_ANSWER = [
  'AX 성숙도 진단을 완료했습니다.',
  `총점 ${MATURITY.totalScore}점 (기준 ${MATURITY.criteriaVersion}).`,
  '',
  '지표가 있는 업무 중 맞는 솔루션이 없어 과제 추천과 로드맵은 제공하지 않습니다. 업무 지표를 입력하면 추천을 받을 수 있어요.',
].join('\n')

/** '진단' 시나리오: 추천 과제 없이 성숙도만 저장하고 끝난다. TOKEN·승인 없이 DONE만 온다 */
function assessmentSteps(taskId: string, task: MockTask): Step[] {
  return [
    [
      500,
      () => {
        task.result = { maturity: MATURITY, roadmap: null, answer: ASSESSMENT_ANSWER }
        return emit(taskId, { type: 'DONE', node: 'register', data: { result: task.result } })
      },
    ],
  ]
}

/** 요청 예산이 없으면 Spring은 예산 제약 없이 선정하고 예산 값을 null로 준다 */
function portfolioOf(task: MockTask) {
  if (task.budgetKrw !== null) return PORTFOLIO
  // 예산이 없으면 예산 초과 위반도 없다
  const greedy = PORTFOLIO.greedyTop3 && { ...PORTFOLIO.greedyTop3, violations: PORTFOLIO.greedyTop3.violations.filter((v) => v !== 'BUDGET_EXCEEDED') }
  return { ...PORTFOLIO, budgetKrw: null, remainingBudgetKrw: null, greedyTop3: greedy }
}

const roadmapNameOf = (task: MockTask) => (task.budgetKrw === null ? ROADMAP_NAME.replace(/ \(예산 [^)]*\)/, '') : ROADMAP_NAME)

/** '실패' 시나리오: 포트폴리오 계산 도구가 재시도 후에도 실패 */
function failSteps(taskId: string, task: MockTask): Step[] {
  const name = 'business_optimize_ax_portfolio'
  const label = '예산·선행 조건 조합 탐색 중'
  return [
    [450, () => emit(taskId, { type: 'TOOL_START', node: 'evaluate', data: { tool: name, label } })],
    [1200, () => emit(taskId, { type: 'TOOL_END', node: 'evaluate', data: { tool: name, label, ok: false } })],
    [
      300,
      () => {
        task.traceUrl = TRACE_URL
        return emit(taskId, { type: 'FAILED', node: 'evaluate', data: { message: 'business-mcp 서버에 연결하지 못했습니다. 2회 재시도 후 중단했습니다.', traceUrl: TRACE_URL } })
      },
    ],
  ]
}

function evaluateRest(taskId: string, task: MockTask): Step[] {
  return [
    ...tool(taskId, 'evaluate', 'business_optimize_ax_portfolio', '예산·선행 조건 조합 탐색 중'),
    [
      400,
      () => {
        // approval Node 직전에 Agent가 result 스냅샷을 PATCH 한다고 가정
        task.result = {
          maturity: MATURITY,
          candidates: CANDIDATES,
          portfolio: portfolioOf(task),
          roadmap: { roadmapName: roadmapNameOf(task), budgetLimitKrw: task.budgetKrw, totalAllocatedKrw: totalAllocated, approvalStatus: 'PENDING', items: ROADMAP_ITEMS },
        }
        return emit(taskId, { type: 'TOOL_START', node: 'roadmap', data: { tool: 'roadmap_draft', label: '로드맵 초안 작성 중' } })
      },
    ],
    ...tokens(taskId, SUMMARY_TEXT),
    [
      300,
      () =>
        emit(taskId, {
          type: 'APPROVAL_REQUIRED',
          node: 'approval',
          data: {
            roadmap: { roadmapName: roadmapNameOf(task), budgetLimitKrw: task.budgetKrw, totalAllocatedKrw: totalAllocated, approvalStatus: 'PENDING' },
            items: ROADMAP_ITEMS,
            totalAllocatedKrw: totalAllocated,
            budgetKrw: task.budgetKrw,
          },
        }),
    ],
  ]
}

const departmentOf = (solutionId: number) => DEPARTMENT_ID[CANDIDATES.find((c) => c.solutionId === solutionId)?.departmentName ?? ''] ?? 101

function registerSteps(taskId: string, task: MockTask): Step[] {
  const items = ROADMAP_ITEMS.map((item, i) => ({ ...item, itemId: 901 + i }))
  const projects = items.map((item, i) => ({
    projectId: 10001 + i,
    itemId: item.itemId,
    projectName: item.itemName,
    ownerDepartmentId: departmentOf(item.solutionId),
    projectStatus: 'REGISTERED',
  }))
  return [
    ...tool(taskId, 'register', 'business_create_ax_roadmap', '로드맵 등록 중', 300),
    ...projects.flatMap((p) => tool(taskId, 'register', 'business_create_ax_project', `프로젝트 등록 중: ${p.projectName}`, 250)),
    [
      400,
      () => {
        task.result = {
          ...task.result,
          roadmap: { roadmapId: 801, roadmapName: roadmapNameOf(task), budgetLimitKrw: task.budgetKrw, totalAllocatedKrw: totalAllocated, approvalStatus: 'APPROVED', items },
          projects,
        }
        return emit(taskId, { type: 'DONE', node: 'register', data: { result: task.result } })
      },
    ],
  ]
}

export async function createTask(requestText: string): Promise<{ taskId: string }> {
  await wait(250)
  if (!requestText.trim()) throw new ApiError(400, { code: 'BAD_REQUEST', message: '요청 내용을 입력해 주세요.' })
  const taskId = crypto.randomUUID()
  tasks.set(taskId, {
    ownerId: currentUserId(),
    requestText,
    createdAt: new Date().toISOString(),
    completedAt: null,
    failing: requestText.includes('실패'),
    assessmentOnly: requestText.includes('진단'),
    budgetKrw: /예산|억/.test(requestText) ? BUDGET_KRW : null,
    status: 'QUEUED',
    result: null,
    traceUrl: null,
    listeners: new Set(),
    timers: [],
    started: false,
  })
  return { taskId }
}

export async function getTask(taskId: string): Promise<TaskDetail> {
  await wait(150)
  const task = find(taskId)
  return { taskId, status: task.status, result: task.result, traceUrl: task.traceUrl }
}

export async function submitApproval(taskId: string, { decision, reason }: ApprovalRequest): Promise<void> {
  await wait(400)
  const task = find(taskId)
  if (task.status !== 'WAITING_APPROVAL') {
    throw new ApiError(409, { code: 'INVALID_STATE', message: '승인 대기 중인 작업이 아닙니다.' })
  }
  // §8: Spring이 결정을 result.approval에 기록한다
  task.result = { ...task.result, approval: { decision, userId: currentUserId() ?? 0, reason: reason ?? null, decidedAt: new Date().toISOString() } }
  if (decision === 'REJECT') {
    task.status = 'REJECTED'
    task.completedAt = new Date().toISOString()
    return
  }
  task.status = 'RUNNING'
  run(task, registerSteps(taskId, task))
}

export async function getExtraction(taskId: string): Promise<ExtractionDraft> {
  await wait(250)
  const task = find(taskId)
  if (!task.draft) throw new ApiError(404, { code: 'NOT_FOUND', message: '추출 결과를 찾을 수 없습니다.' })
  return task.draft
}

export async function confirmExtraction(taskId: string, payload: ExtractionPayload): Promise<void> {
  await wait(500)
  const task = find(taskId)
  if (task.status !== 'WAITING_CONFIRMATION' || !task.draft) {
    throw new ApiError(409, { code: 'INVALID_STATE', message: '확정 대기 중인 작업만 확정할 수 있습니다.' })
  }
  if (confirmedOwners.has(task.ownerId)) throw new ApiError(409, { code: 'INVALID_STATE', message: '이미 기업 데이터가 확정되었습니다.' })
  const departmentKeys = payload.departments.map((d) => d.key)
  const broken = payload.processes.find((p) => !departmentKeys.includes(p.departmentKey))
  if (broken) {
    throw new ApiError(400, { code: 'VALIDATION_ERROR', message: `업무 ${broken.key}의 부서 ${broken.departmentKey}가 없습니다.`, hint: { validKeys: departmentKeys } })
  }
  confirmedOwners.add(task.ownerId)
  task.draft = { ...task.draft, status: 'CONFIRMED', payload }
  task.status = 'RUNNING'
  run(task, analysisSteps(taskId, task))
}

export async function listMyTasks(): Promise<TaskSummary[]> {
  await wait(250)
  const me = currentUserId()
  return [...tasks.entries()]
    .filter(([, t]) => t.ownerId === me)
    .map(([taskId, t]) => ({ taskId, status: t.status, requestText: t.requestText, createdAt: t.createdAt, completedAt: t.completedAt }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function subscribe(taskId: string, listener: Listener, onError: (status?: number) => void): () => void {
  const task = tasks.get(taskId)
  if (!task || task.ownerId !== currentUserId()) {
    const timer = window.setTimeout(() => onError(task ? 403 : 404), 200)
    return () => window.clearTimeout(timer)
  }
  task.listeners.add(listener)
  if (!task.started) {
    task.started = true
    task.status = 'RUNNING'
    run(task, confirmedOwners.has(task.ownerId) ? analysisSteps(taskId, task) : extractionSteps(taskId, task))
  }
  return () => task.listeners.delete(listener)
}

export async function getDocument(documentId: number): Promise<DocumentDetail> {
  await wait(300)
  const doc = uploadedDocument(documentId) ?? DOCUMENTS[documentId]
  if (!doc) throw new ApiError(404, { code: 'NOT_FOUND', message: `문서 ${documentId}를 찾을 수 없습니다.` })
  return doc
}
