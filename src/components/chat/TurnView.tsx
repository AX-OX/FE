import { RoadmapReport } from '@/components/roadmap/RoadmapReport'
import { formatKrw } from '@/lib/format'
import { useChatStore, type Turn } from '@/stores/chatStore'
import { ApprovalCard } from './ApprovalCard'
import { Markdown } from './Markdown'
import { AiMessage, UserMessage } from './Message'
import { ProgressSteps } from './ProgressSteps'
import { ThinkingBubble } from './ThinkingBubble'

/** 사용자 요청 1개와 그에 대한 AI 응답 묶음 */
export function TurnView({ turn }: { turn: Turn }) {
  const decide = useChatStore((s) => s.decide)
  const started = turn.tools.length > 0 || turn.text.length > 0
  // 이력에서 불러온 턴은 진행 과정이 없으므로 상태만 보고 판단한다
  const pending = !started && (turn.status === 'QUEUED' || (turn.status === 'RUNNING' && !turn.restored))
  const streaming = turn.nodes.roadmap === 'active' && turn.status === 'RUNNING'
  const hasRoadmap = !!(turn.approval || turn.result?.roadmap)
  const projects = turn.result?.projects ?? []

  return (
    <div className="flex flex-col gap-2">
      <UserMessage text={turn.requestText} />

      {pending ? (
        <AiMessage>
          <ThinkingBubble />
        </AiMessage>
      ) : (
        <>
          {started && (
            <AiMessage>
              <ProgressSteps turn={turn} />
            </AiMessage>
          )}

          {!started && turn.restored && turn.status !== 'FAILED' && (
            <AiMessage>
              <div className="glass p-2.5 text-sm text-muted">작업 이력에서 불러온 결과예요. 진행 과정과 답변 원문은 남아 있지 않아요.</div>
            </AiMessage>
          )}

          {turn.text && (
            <AiMessage label={false}>
              <div className="glass p-2.5 text-sm">
                <Markdown>{turn.text}</Markdown>
                {streaming && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-caret bg-ink" aria-hidden="true" />}
              </div>
            </AiMessage>
          )}

          {hasRoadmap && (
            <AiMessage wide label={false}>
              <RoadmapReport turn={turn} />
            </AiMessage>
          )}

          {turn.status === 'WAITING_APPROVAL' && (
            <AiMessage label={false}>
              <ApprovalCard turn={turn} onDecide={(d) => decide(turn.id, d)} />
            </AiMessage>
          )}

          {turn.status === 'RUNNING' && turn.decision?.decision === 'APPROVE' && (
            <AiMessage label={false}>
              <div className="glass p-2.5 text-sm">승인했습니다. 로드맵과 프로젝트를 등록하고 있어요…</div>
            </AiMessage>
          )}

          {turn.status === 'DONE' && (
            <AiMessage label={false}>
              <div className="rounded-lg border border-emerald-600/20 bg-emerald-50/80 p-3 text-sm">
                <p className="font-semibold text-emerald-900">로드맵을 승인하고 프로젝트 {projects.length}건을 등록했습니다.</p>
                {projects.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[13px] text-emerald-900/80">
                    {projects.map((p) => (
                      <li key={p.projectId}>
                        #{p.projectId} {p.projectName} <span className="text-[11px]">({p.projectStatus === 'REGISTERED' ? '등록됨' : p.projectStatus})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </AiMessage>
          )}

          {turn.status === 'REJECTED' && (
            <AiMessage label={false}>
              <div className="glass p-2.5 text-sm">
                로드맵을 거절했습니다. 등록된 프로젝트는 없습니다.
                {turn.decision?.reason && <p className="mt-1 text-[13px] text-muted">사유: {turn.decision.reason}</p>}
                <p className="mt-1 text-[13px] text-muted">조건을 바꿔 다시 요청할 수 있어요. 예: “인사는 빼고 {turn.approval ? formatKrw(turn.approval.budgetKrw) : '예산'} 안에서 다시 짜 줘”</p>
              </div>
            </AiMessage>
          )}
        </>
      )}

      {turn.status === 'FAILED' && (
        <AiMessage label={!started}>
          <div role="alert" className="rounded-lg border border-danger/30 bg-white/80 p-3 text-sm">
            <p className="font-semibold text-danger">분석을 완료하지 못했습니다.</p>
            <p className="mt-1 text-[13px]">{turn.error?.message}</p>
            {turn.error?.traceUrl && (
              <a href={turn.error.traceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[13px] text-accent underline underline-offset-2">
                실행 기록(trace) 보기
              </a>
            )}
          </div>
        </AiMessage>
      )}
    </div>
  )
}
