/**
 * Figma 노드 0:7 — 블러 원 2개. 좌표는 1280×832 프레임 기준을 카드 하단 중앙 기준으로 옮김.
 * CSS blur 반경 = Figma feGaussianBlur stdDeviation.
 */
export function BackgroundBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute bottom-[-133px] left-1/2 size-[414px] -translate-x-[282px] rounded-full bg-blob-pink blur-[250px]" />
      <div className="absolute bottom-[51px] left-1/2 size-[280px] translate-x-[-18px] rounded-full bg-blob-blue blur-[150px]" />
    </div>
  )
}
