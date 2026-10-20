import { create } from 'zustand'
import { ApiError } from '@/api/client'
import { createTask, getTask, submitApproval, subscribeTaskEvents } from '@/api/tasks'
import type { AgentNode, ApprovalRequest, ApprovalRequiredData, TaskDetail, TaskEvent, TaskResult, TaskStatus } from '@/types/task'

export const NODE_ORDER: AgentNode[] = ['collect', 'retrieve', 'assess', 'discover', 'evaluate', 'roadmap', 'approval', 'register']

export type NodeState = 'pending' | 'active' | 'done' | 'error'

export interface ToolLog {
  node?: AgentNode
  tool: string
  label: string
  ok?: boolean
}

/** 사용자 요청 1개 + 그에 대한 AI 작업 1개 */
export interface Turn {
  id: string
  requestText: string
  taskId?: string
  status: TaskStatus
  nodes: Record<AgentNode, NodeState>
  currentLabel?: string
  tools: ToolLog[]
  text: string
  approval?: ApprovalRequiredData
  result?: TaskResult
  decision?: ApprovalRequest
  approvalPending: boolean
  approvalError?: string
  error?: { message: string; traceUrl?: string }
}

interface ChatState {
  turns: Turn[]
  openDocumentId: number | null
  send: (text: string) => Promise<void>
  decide: (turnId: string, decision: ApprovalRequest) => Promise<void>
  openDocument: (documentId: number | null) => void
  reset: () => void
}

const unsubscribers = new Map<string, () => void>()

function stopStream(turnId: string) {
  unsubscribers.get(turnId)?.()
  unsubscribers.delete(turnId)
}

const initialNodes = () => Object.fromEntries(NODE_ORDER.map((n) => [n, 'pending'])) as Record<AgentNode, NodeState>
const allDone = () => Object.fromEntries(NODE_ORDER.map((n) => [n, 'done'])) as Record<AgentNode, NodeState>

/** node를 진행 중으로, 그 앞 단계는 모두 완료로 */
function advance(nodes: Record<AgentNode, NodeState>, node: AgentNode, state: NodeState = 'active') {
  const idx = NODE_ORDER.indexOf(node)
  const next = { ...nodes }
  NODE_ORDER.forEach((n, i) => {
    if (i < idx) next[n] = 'done'
  })
  next[node] = state
  return next
}

function reduce(turn: Turn, event: TaskEvent): Turn {
  const running: Turn = turn.status === 'QUEUED' ? { ...turn, status: 'RUNNING' } : turn

  switch (event.type) {
    case 'TOOL_START':
      return {
        ...running,
        nodes: event.node ? advance(running.nodes, event.node) : running.nodes,
        currentLabel: event.data.label,
        tools: [...running.tools, { node: event.node, tool: event.data.tool, label: event.data.label }],
      }
    case 'TOOL_END': {
      const tools = [...running.tools]
      for (let i = tools.length - 1; i >= 0; i--) {
        if (tools[i].tool === event.data.tool && tools[i].ok === undefined) {
          tools[i] = { ...tools[i], ok: event.data.ok }
          break
        }
      }
      return { ...running, tools }
    }
    case 'TOKEN':
      return {
        ...running,
        nodes: running.nodes.roadmap === 'pending' ? advance(running.nodes, 'roadmap') : running.nodes,
        text: running.text + event.data.text,
      }
    case 'APPROVAL_REQUIRED':
      return {
        ...running,
        status: 'WAITING_APPROVAL',
        nodes: advance(running.nodes, 'approval'),
        currentLabel: '승인 대기 중',
        approval: event.data,
      }
    case 'DONE':
      return {
        ...running,
        status: 'DONE',
        nodes: allDone(),
        currentLabel: undefined,
        result: { ...running.result, ...event.data.result },
      }
    case 'FAILED': {
      const active = NODE_ORDER.find((n) => running.nodes[n] === 'active')
      return {
        ...running,
        status: 'FAILED',
        nodes: active ? { ...running.nodes, [active]: 'error' } : running.nodes,
        currentLabel: undefined,
        error: { message: event.data.message, traceUrl: event.data.traceUrl },
      }
    }
  }
}

export const useChatStore = create<ChatState>()((set, get) => {
  const update = (turnId: string, fn: (t: Turn) => Turn) =>
    set((s) => ({ turns: s.turns.map((t) => (t.id === turnId ? fn(t) : t)) }))

  /** 승인 카드가 뜨면 성숙도·후보 ROI가 담긴 result 스냅샷을 가져온다 */
  async function loadSnapshot(turnId: string, taskId: string) {
    try {
      const detail = await getTask(taskId)
      if (detail.result) update(turnId, (t) => ({ ...t, result: { ...detail.result, ...t.result } }))
    } catch {
      // 스냅샷이 없어도 APPROVAL_REQUIRED 데이터만으로 로드맵은 보인다
    }
  }

  /** 재연결 후 서버 상태로 다시 맞춘다 (끊긴 사이 DONE·APPROVAL_REQUIRED 등을 놓쳤을 수 있음) */
  async function resync(turnId: string, taskId: string) {
    let detail: TaskDetail
    try {
      detail = await getTask(taskId)
    } catch {
      return
    }
    if (detail.status === 'DONE' || detail.status === 'FAILED' || detail.status === 'REJECTED') stopStream(turnId)

    update(turnId, (t) => {
      const result = detail.result ? { ...t.result, ...detail.result } : t.result
      switch (detail.status) {
        case 'DONE':
          return { ...t, status: 'DONE', result, currentLabel: undefined, nodes: allDone() }
        case 'FAILED':
          return { ...t, status: 'FAILED', result, currentLabel: undefined, error: { message: '작업이 실패했습니다.', traceUrl: detail.traceUrl ?? undefined } }
        case 'REJECTED':
          return { ...t, status: 'REJECTED', result, currentLabel: undefined }
        case 'WAITING_APPROVAL': {
          const roadmap = result?.roadmap
          if (t.approval || !roadmap) return { ...t, result }
          return {
            ...t,
            result,
            status: 'WAITING_APPROVAL',
            currentLabel: '승인 대기 중',
            nodes: advance(t.nodes, 'approval'),
            approval: { roadmap, items: roadmap.items, totalAllocatedKrw: roadmap.totalAllocatedKrw, budgetKrw: roadmap.budgetLimitKrw },
          }
        }
        default:
          return { ...t, result }
      }
    })
  }

  return {
    turns: [],
    openDocumentId: null,

    async send(text) {
      const requestText = text.trim()
      if (!requestText) return
      const turnId = crypto.randomUUID()
      set((s) => ({
        turns: [
          ...s.turns,
          { id: turnId, requestText, status: 'QUEUED', nodes: initialNodes(), tools: [], text: '', approvalPending: false },
        ],
      }))

      try {
        const { taskId } = await createTask(requestText)
        update(turnId, (t) => ({ ...t, taskId }))
        const unsubscribe = subscribeTaskEvents(taskId, {
          onEvent: (event) => {
            update(turnId, (t) => reduce(t, event))
            if (event.type === 'APPROVAL_REQUIRED') void loadSnapshot(turnId, taskId)
            if (event.type === 'DONE' || event.type === 'FAILED') stopStream(turnId)
          },
          onReconnect: () => void resync(turnId, taskId),
          onError: (status) => {
            stopStream(turnId)
            const message =
              status === 403 || status === 404
                ? '이 작업의 진행 상황을 볼 권한이 없습니다.'
                : status === 401
                  ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
                  : '진행 상황 연결이 끊어졌습니다. 잠시 후 다시 시도해 주세요.'
            update(turnId, (t) => (t.status === 'DONE' || t.status === 'REJECTED' ? t : { ...t, status: 'FAILED', error: { message } }))
          },
        })
        unsubscribers.set(turnId, unsubscribe)
      } catch (err) {
        update(turnId, (t) => ({
          ...t,
          status: 'FAILED',
          error: { message: err instanceof ApiError ? err.message : '작업을 시작하지 못했습니다.' },
        }))
      }
    },

    async decide(turnId, decision) {
      const turn = get().turns.find((t) => t.id === turnId)
      if (!turn?.taskId || turn.status !== 'WAITING_APPROVAL') return
      update(turnId, (t) => ({ ...t, approvalPending: true, approvalError: undefined }))
      try {
        await submitApproval(turn.taskId, decision)
        if (decision.decision === 'REJECT') {
          // §8에 거절 종료 이벤트가 없어서 202를 받으면 바로 종료 처리
          stopStream(turnId)
          update(turnId, (t) => ({
            ...t,
            status: 'REJECTED',
            decision,
            approvalPending: false,
            currentLabel: undefined,
            nodes: { ...t.nodes, approval: 'done' },
          }))
        } else {
          update(turnId, (t) => ({ ...t, status: 'RUNNING', decision, approvalPending: false, currentLabel: '프로젝트 등록 준비 중' }))
        }
      } catch (err) {
        update(turnId, (t) => ({
          ...t,
          approvalPending: false,
          approvalError: err instanceof ApiError ? err.message : '처리하지 못했습니다. 다시 시도해 주세요.',
        }))
      }
    },

    openDocument(documentId) {
      set({ openDocumentId: documentId })
    },

    reset() {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      unsubscribers.clear()
      set({ turns: [], openDocumentId: null })
    },
  }
})

export const isBusy = (turn?: Turn) => !!turn && (turn.status === 'QUEUED' || turn.status === 'RUNNING' || turn.status === 'WAITING_APPROVAL')
