import { useState } from 'react'
import { NODE_LABEL } from '@/components/roadmap/labels'
import { NODE_ORDER, type NodeState, type Turn } from '@/stores/chatStore'

function StepIcon({ state }: { state: NodeState }) {
  if (state === 'done')
    return (
      <svg viewBox="0 0 16 16" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (state === 'active') return <span className="size-3.5 animate-spin rounded-full border-2 border-accent/25 border-t-accent" aria-hidden="true" />
  if (state === 'error') return <span className="grid size-4 place-items-center text-xs font-bold text-danger" aria-hidden="true">!</span>
  return <span className="size-1.5 rounded-full bg-ink/20" aria-hidden="true" />
}

const STATE_TEXT: Record<NodeState, string> = { done: '완료', active: '진행 중', error: '실패', pending: '대기' }

/** §8 TOOL_START/TOOL_END 이벤트로 그리는 진행 표시. 분석이 끝나면 한 줄로 접힌다. */
export function ProgressSteps({ turn }: { turn: Turn }) {
  const running = turn.status === 'QUEUED' || turn.status === 'RUNNING'
  const [userOpen, setUserOpen] = useState<boolean | null>(null)
  const open = userOpen ?? running

  // 승인 전에는 등록 단계를 보여줄 필요가 없다
  const nodes = turn.decision?.decision === 'APPROVE' ? NODE_ORDER : NODE_ORDER.filter((n) => n !== 'register')
  const doneCount = nodes.filter((n) => turn.nodes[n] === 'done').length
  const toolCount = turn.tools.length
  // 분석이 시작됐는데 아직 진행 이벤트가 없으면 첫 단계를 진행 중으로 보여 준다
  const warmingUp = turn.status === 'RUNNING' && nodes.every((n) => turn.nodes[n] === 'pending')
  const stateOf = (node: (typeof nodes)[number]): NodeState => (warmingUp && node === nodes[0] ? 'active' : turn.nodes[node])
  const waitingLabel = !turn.taskId ? '요청을 보내는 중' : turn.status === 'QUEUED' ? '분석 대기 중' : '분석 준비 중'

  return (
    <div className="glass p-2.5 text-[13px]">
      <button
        type="button"
        onClick={() => setUserOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          {running ? <StepIcon state="active" /> : <StepIcon state={turn.status === 'FAILED' ? 'error' : 'done'} />}
          <span className="truncate font-medium">
            {running ? (turn.currentLabel ?? waitingLabel) : `분석 과정 ${doneCount}/${nodes.length}단계 · 도구 호출 ${toolCount}회`}
          </span>
        </span>
        <svg viewBox="0 0 16 16" className={`size-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ol className="mt-2.5 space-y-1.5 border-t border-white pt-2.5">
          {nodes.map((node) => {
            const state = stateOf(node)
            const tools = turn.tools.filter((t) => t.node === node)
            return (
              <li key={node} className="flex items-start gap-2.5">
                <span className="grid h-5 w-4 shrink-0 place-items-center">
                  <StepIcon state={state} />
                </span>
                <div className="min-w-0">
                  <p className={state === 'pending' ? 'text-muted/70' : state === 'error' ? 'text-danger' : ''}>
                    {NODE_LABEL[node]}
                    <span className="sr-only"> ({STATE_TEXT[state]})</span>
                  </p>
                  {tools.length > 0 && (
                    <p className="truncate text-[11px] text-muted">
                      {state === 'active' ? tools[tools.length - 1].label : tools.map((t) => t.tool.replace(/^(business|rag)_/, '')).join(' · ')}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
