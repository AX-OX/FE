import { useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { TurnView } from './TurnView'

/** 대화 목록. 사용자가 맨 아래를 보고 있을 때만 새 내용에 맞춰 따라 내려간다. */
export function MessageList() {
  const turns = useChatStore((s) => s.turns)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)
  const turnCount = turns.length

  // 새 요청을 보내면 무조건 맨 아래로
  useEffect(() => {
    stickRef.current = true
  }, [turnCount])

  useEffect(() => {
    const el = scrollRef.current
    if (el && stickRef.current) el.scrollTop = el.scrollHeight
  }, [turns])

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => {
        const el = e.currentTarget
        stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
      }}
      className="min-h-0 w-full flex-1 overflow-y-auto [scrollbar-color:rgb(22_2_17/0.15)_transparent] [scrollbar-width:thin]"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[915px] flex-col justify-end gap-8 px-4 py-4">
        {turns.map((turn) => (
          <TurnView key={turn.id} turn={turn} />
        ))}
      </div>
    </div>
  )
}
