import { ApiError } from '@/api/client'
import type { AgentNode, ApprovalRequest, DocumentDetail, TaskDetail, TaskEvent, TaskResult, TaskStatus } from '@/types/task'
import { BUDGET_KRW, CANDIDATES, DOCUMENTS, MATURITY, ROADMAP_ITEMS, SUMMARY_TEXT } from './fixtures'

/** 백엔드 없이 §8 이벤트 흐름(TOOL → TOKEN → APPROVAL_REQUIRED → 승인 → DONE)을 흉내 낸다. */

type Listener = (e: TaskEvent) => void
type Step = [delayMs: number, make: () => TaskEvent]

interface MockTask {
  status: TaskStatus
  result: TaskResult | null
  listeners: Set<Listener>
  timers: number[]
  started: boolean
}

const tasks = new Map<string, MockTask>()
const ROADMAP_NAME = '2027 AX 투자 로드맵 (예산 3억 원)'
const totalAllocated = ROADMAP_ITEMS.reduce((sum, i) => sum + i.allocatedBudgetKrw, 0)

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function find(taskId: string): MockTask {
  const task = tasks.get(taskId)
  if (!task) throw new ApiError(404, { code: 'NOT_FOUND', message: '작업을 찾을 수 없습니다.' })
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
        if (event.type === 'DONE') task.status = 'DONE'
        task.listeners.forEach((l) => l(event))
      }, at),
    )
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
    ...tool(taskId, 'discover', 'business_get_solution_catalog', 'AI 솔루션 카탈로그 조회 중'),
    ...tool(taskId, 'evaluate', 'business_calculate_ax_roi', '후보 8개 ROI 계산 중'),
    ...tool(taskId, 'evaluate', 'business_optimize_ax_portfolio', '예산 내 최적 조합 탐색 중'),
    [
      400,
      () => {
        // approval Node 직전에 Agent가 result 스냅샷을 PATCH 한다고 가정
        task.result = {
          maturity: MATURITY,
          candidates: CANDIDATES,
          roadmap: { roadmapName: ROADMAP_NAME, budgetLimitKrw: BUDGET_KRW, totalAllocatedKrw: totalAllocated, approvalStatus: 'PENDING', items: ROADMAP_ITEMS },
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
            roadmap: { roadmapName: ROADMAP_NAME, budgetLimitKrw: BUDGET_KRW, totalAllocatedKrw: totalAllocated, approvalStatus: 'PENDING' },
            items: ROADMAP_ITEMS,
            totalAllocatedKrw: totalAllocated,
            budgetKrw: BUDGET_KRW,
          },
        }),
    ],
  ]
}

function registerSteps(taskId: string, task: MockTask): Step[] {
  const items = ROADMAP_ITEMS.map((item, i) => ({ ...item, itemId: 101 + i }))
  const projects = items.map((item, i) => ({
    projectId: 201 + i,
    itemId: item.itemId,
    projectName: item.itemName,
    ownerDepartmentId: { 구매: 2, 고객지원: 4 }[item.departmentName ?? ''] ?? 1,
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
          roadmap: { roadmapId: 11, roadmapName: ROADMAP_NAME, budgetLimitKrw: BUDGET_KRW, totalAllocatedKrw: totalAllocated, approvalStatus: 'APPROVED', items },
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
  tasks.set(taskId, { status: 'QUEUED', result: null, listeners: new Set(), timers: [], started: false })
  return { taskId }
}

export async function getTask(taskId: string): Promise<TaskDetail> {
  await wait(150)
  const task = find(taskId)
  return { taskId, status: task.status, result: task.result, traceUrl: null }
}

export async function submitApproval(taskId: string, { decision }: ApprovalRequest): Promise<void> {
  await wait(400)
  const task = find(taskId)
  if (task.status !== 'WAITING_APPROVAL') {
    throw new ApiError(409, { code: 'INVALID_STATE', message: '승인 대기 중인 작업이 아닙니다.' })
  }
  if (decision === 'REJECT') {
    task.status = 'REJECTED'
    return
  }
  task.status = 'RUNNING'
  run(task, registerSteps(taskId, task))
}

export function subscribe(taskId: string, listener: Listener): () => void {
  const task = tasks.get(taskId)
  if (!task) return () => {}
  task.listeners.add(listener)
  if (!task.started) {
    task.started = true
    task.status = 'RUNNING'
    run(task, analysisSteps(taskId, task))
  }
  return () => task.listeners.delete(listener)
}

export async function getDocument(documentId: number): Promise<DocumentDetail> {
  await wait(300)
  const doc = DOCUMENTS[documentId]
  if (!doc) throw new ApiError(404, { code: 'NOT_FOUND', message: `문서 ${documentId}를 찾을 수 없습니다.` })
  return doc
}
