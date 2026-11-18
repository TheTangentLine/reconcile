// Drag-to-turn: which layer turns, and which way, when you grab a sticker and
// drag across the screen. Pure math, no rendering, so it can be unit-tested.
import { layerMove, type Axis, type Move, type Vec3 } from './model'

/** Projects a world-space point to screen pixels [x, y] (y grows downwards). */
export type Project = (p: Vec3) => [number, number]

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

/**
 * @param pos     the grabbed cubie's position (integers -1..1)
 * @param normal  the grabbed sticker's outward normal, e.g. [0, 0, 1] for a front sticker
 * @param point   where the pointer hit, in world space
 * @param drag    how far the pointer moved on screen, in pixels [dx, dy]
 *
 * The sticker can slide along the two axes lying in its face. We pick the
 * one whose on-screen direction best matches the drag, then turn the layer
 * that carries the sticker that way. Rotating by +90° around (normal × t)
 * moves a point on the face towards t, which fixes the turn direction.
 */
export function moveFromDrag(pos: Vec3, normal: Vec3, point: Vec3, drag: [number, number], project: Project): Move {
  const len = Math.hypot(drag[0], drag[1]) || 1
  const d = [drag[0] / len, drag[1] / len]
  const [sx, sy] = project(point)

  let best: { t: Vec3; score: number } | null = null
  for (let axis = 0; axis < 3; axis++) {
    if (normal[axis] !== 0) continue
    for (const sign of [1, -1]) {
      const t: Vec3 = [0, 0, 0]
      t[axis] = sign
      const [ex, ey] = project([point[0] + t[0] * 0.5, point[1] + t[1] * 0.5, point[2] + t[2] * 0.5])
      const sl = Math.hypot(ex - sx, ey - sy) || 1
      const score = ((ex - sx) * d[0] + (ey - sy) * d[1]) / sl
      if (!best || score > best.score) best = { t, score }
    }
  }

  const k = cross(normal, best!.t) // exactly one non-zero component, ±1
  const axis = k.findIndex((v) => v !== 0) as Axis
  return layerMove(axis, pos[axis], k[axis] > 0 ? 1 : -1)
}
