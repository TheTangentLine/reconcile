import { useMemo } from 'react'
import {
  applyMoves, caseState, COLORS, createSolved, getFacelet, orientationMoves,
  type ColorKey, type CubeState,
} from '../cube/model'
import type { Formula } from '../data/methods'

/** Top-down view of the case a formula solves: the U face plus the top row of each side. */
export default function CaseDiagram({ formula, size = 96 }: { formula: Formula; size?: number }) {
  const cube = useMemo<CubeState>(() => {
    const raw = caseState(formula.alg, formula.hold)
    const orient = formula.hold ? orientationMoves(createSolved(), formula.hold.up, formula.hold.front) ?? [] : []
    return applyMoves(raw, orient)
  }, [formula])

  const cell = 10
  const side = 3.4
  const gap = 1
  const off = side + gap
  const fill = (c: ColorKey) => COLORS[c].hex
  const rects: React.ReactNode[] = []

  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      rects.push(
        <rect key={`u${r}${c}`} x={off + c * cell + 0.5} y={off + r * cell + 0.5}
          width={cell - 1} height={cell - 1} fill={fill(getFacelet(cube, 'U', r, c))} />,
      )
  for (let i = 0; i < 3; i++) {
    const along = off + i * cell + 0.5
    rects.push(
      // Back strip (above), left-to-right is B columns 2..0
      <rect key={`b${i}`} x={along} y={0} width={cell - 1} height={side}
        fill={fill(getFacelet(cube, 'B', 0, 2 - i))} />,
      // Front strip (below)
      <rect key={`f${i}`} x={along} y={off + 3 * cell + gap} width={cell - 1} height={side}
        fill={fill(getFacelet(cube, 'F', 0, i))} />,
      // Left strip, top-to-bottom is L columns 0..2
      <rect key={`l${i}`} x={0} y={along} width={side} height={cell - 1}
        fill={fill(getFacelet(cube, 'L', 0, i))} />,
      // Right strip, top-to-bottom is R columns 2..0
      <rect key={`r${i}`} x={off + 3 * cell + gap} y={along} width={side} height={cell - 1}
        fill={fill(getFacelet(cube, 'R', 0, 2 - i))} />,
    )
  }

  const total = 2 * off + 3 * cell
  return (
    <svg className="case-diagram" shapeRendering="crispEdges" viewBox={`0 0 ${total} ${total}`} width={size} height={size}
      role="img" aria-label={`Starting position for ${formula.name}`}>
      <rect x={off - 0.5} y={off - 0.5} width={3 * cell + 1} height={3 * cell + 1} fill="#14151a" />
      {rects}
    </svg>
  )
}
