const SUGGESTIONS = [
  '현재 업무 데이터를 분석해서 AI 도입 효과가 높은 과제 3개를 선정하고, 예산 3억 원 내에서 최적의 AX 투자 로드맵을 만들어 줘.',
  '우리 회사의 AX 성숙도를 진단하고 근거 문서를 보여 줘.',
  '개발팀에서 자동화 효과가 가장 큰 업무는 뭐야?',
]

/** design-spec §4.3 — 추천 질문 칩 */
export function Suggestions({ onPick }: { onPick: (text: string) => void }) {
  return (
    <section aria-labelledby="suggestions-label">
      <h2 id="suggestions-label" className="mb-4 pl-2.5 text-sm font-bold text-muted">
        이렇게 물어보세요
      </h2>
      <ul className="flex flex-col gap-3.5 sm:flex-row">
        {SUGGESTIONS.map((text) => (
          <li key={text} className="flex sm:flex-1">
            <button
              type="button"
              onClick={() => onPick(text)}
              className="glass w-full p-2.5 text-left text-sm transition-colors hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-line-strong"
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
