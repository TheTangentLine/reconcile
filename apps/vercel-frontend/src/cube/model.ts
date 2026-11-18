// Pure cube logic: state, moves, notation parsing. No rendering here.
//
// Coordinates: x = right(+1)/left(-1), y = up(+1)/down(-1), z = front(+1)/back(-1).
// A cube is 26 visible cubies; each cubie has a position and stickers
// identified by their outward normal. Turning a layer rotates both.

export type Vec3 = [number, number, number]
export type Axis = 0 | 1 | 2 // x | y | z

export type ColorKey = 'W' | 'Y' | 'G' | 'B' | 'R' | 'O'
export type FaceKey = 'U' | 'D' | 'F' | 'B' | 'R' | 'L'

export interface Sticker {
  normal: Vec3
  color: ColorKey
}

export interface Cubie {
  id: string // stable identity (home position), used as React key
  pos: Vec3
  stickers: Sticker[]
}

export type CubeState = Cubie[]

export interface Move {
  token: string // original notation, e.g. "R'", "U2", "x"
  axis: Axis
  layers: number[] // which slices along the axis turn
  quarterTurns: number // signed, right-hand rule around +axis (1 = +90°)
}

export const COLORS: Record<ColorKey, { name: string; hex: string }> = {
  W: { name: 'White', hex: '#f5f5f0' },
  Y: { name: 'Yellow', hex: '#ffd23f' },
  G: { name: 'Green', hex: '#1fae5b' },
  B: { name: 'Blue', hex: '#2f6fe4' },
  R: { name: 'Red', hex: '#e2402f' },
  O: { name: 'Orange', hex: '#ff8a1f' },
}

export const COLOR_KEYS: ColorKey[] = ['W', 'Y', 'G', 'B', 'R', 'O']

export const FACE_KEYS: FaceKey[] = ['U', 'L', 'F', 'R', 'B', 'D']

export const FACE_NAMES: Record<FaceKey, string> = {
  U: 'Up',
  D: 'Down',
  F: 'Front',
  B: 'Back',
  R: 'Right',
  L: 'Left',
}

export const FACE_NORMALS: Record<FaceKey, Vec3> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
  R: [1, 0, 0],
  L: [-1, 0, 0],
}

/** Standard Western color scheme: white top, green front. */
export const DEFAULT_SCHEME: Record<FaceKey, ColorKey> = {
  U: 'W',
  D: 'Y',
  F: 'G',
  B: 'B',
  R: 'R',
  L: 'O',
}

const eq = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]

export function createSolved(scheme: Record<FaceKey, ColorKey> = DEFAULT_SCHEME): CubeState {
  const cubies: CubeState = []
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue
        const pos: Vec3 = [x, y, z]
        const stickers: Sticker[] = []
        for (const face of FACE_KEYS) {
          const n = FACE_NORMALS[face]
          const axis = n.findIndex((v) => v !== 0)
          if (pos[axis] === n[axis]) stickers.push({ normal: n, color: scheme[face] })
        }
        cubies.push({ id: `${x},${y},${z}`, pos, stickers })
      }
  return cubies
}

/** Rotate an integer vector by quarterTurns * 90° around an axis (right-hand rule). */
export function rotateVec(v: Vec3, axis: Axis, quarterTurns: number): Vec3 {
  const q = ((quarterTurns % 4) + 4) % 4
  let [x, y, z] = v
  for (let i = 0; i < q; i++) {
    if (axis === 0) [y, z] = [-z, y]
    else if (axis === 1) [z, x] = [-x, z]
    else [x, y] = [-y, x]
  }
  return [x, y, z]
}

export function isInLayer(pos: Vec3, move: Move) {
  return move.layers.includes(pos[move.axis])
}

export function applyMove(state: CubeState, move: Move): CubeState {
  return state.map((c) =>
    isInLayer(c.pos, move)
      ? {
          ...c,
          pos: rotateVec(c.pos, move.axis, move.quarterTurns),
          stickers: c.stickers.map((s) => ({
            ...s,
            normal: rotateVec(s.normal, move.axis, move.quarterTurns),
          })),
        }
      : c,
  )
}

export function applyMoves(state: CubeState, moves: Move[]): CubeState {
  return moves.reduce(applyMove, state)
}

// ---------- Notation ----------

// Base definition of each move letter: axis, layers, and the direction of a
// clockwise turn (as seen looking at that face) expressed in quarter turns.
const BASE: Record<string, { axis: Axis; layers: number[]; dir: number }> = {
  R: { axis: 0, layers: [1], dir: -1 },
  L: { axis: 0, layers: [-1], dir: 1 },
  U: { axis: 1, layers: [1], dir: -1 },
  D: { axis: 1, layers: [-1], dir: 1 },
  F: { axis: 2, layers: [1], dir: -1 },
  B: { axis: 2, layers: [-1], dir: 1 },
  M: { axis: 0, layers: [0], dir: 1 }, // follows L
  E: { axis: 1, layers: [0], dir: 1 }, // follows D
  S: { axis: 2, layers: [0], dir: -1 }, // follows F
  r: { axis: 0, layers: [0, 1], dir: -1 },
  l: { axis: 0, layers: [-1, 0], dir: 1 },
  u: { axis: 1, layers: [0, 1], dir: -1 },
  d: { axis: 1, layers: [-1, 0], dir: 1 },
  f: { axis: 2, layers: [0, 1], dir: -1 },
  b: { axis: 2, layers: [-1, 0], dir: 1 },
  x: { axis: 0, layers: [-1, 0, 1], dir: -1 },
  y: { axis: 1, layers: [-1, 0, 1], dir: -1 },
  z: { axis: 2, layers: [-1, 0, 1], dir: -1 },
}

const TOKEN_RE = /^([RLUDFBMESrludfbxyz])(w?)(2|3)?('?)(2)?$/

export function parseMove(token: string): Move {
  const m = TOKEN_RE.exec(token)
  if (!m) throw new Error(`Unknown move "${token}"`)
  let [, letter] = m
  const [, , wide, count1, prime, count2] = m
  if (wide) letter = letter.toLowerCase() // Rw == r
  const base = BASE[letter]
  if (!base) throw new Error(`Unknown move "${token}"`)
  const count = Number(count1 || count2 || 1)
  const quarterTurns = base.dir * count * (prime ? -1 : 1)
  return { token, axis: base.axis, layers: base.layers, quarterTurns }
}

/** Parse "R U R' U'" (parentheses and extra spaces are ignored). */
export function parseAlg(alg: string): Move[] {
  return alg
    .replace(/[()[\]]/g, ' ')
    .replace(/’/g, "'")
    .split(/\s+/)
    .filter(Boolean)
    .map(parseMove)
}

export function invertMove(move: Move): Move {
  const t = move.token
  let token: string
  if (/2'?$/.test(t)) token = t // half turns are their own inverse
  else token = t.endsWith("'") ? t.slice(0, -1) : t + "'"
  return { ...move, token, quarterTurns: -move.quarterTurns }
}

export function invertAlg(moves: Move[]): Move[] {
  return [...moves].reverse().map(invertMove)
}

export function describeMove(move: Move): string {
  const letter = move.token[0]
  const names: Record<string, string> = {
    R: 'right face', L: 'left face', U: 'top face', D: 'bottom face',
    F: 'front face', B: 'back face',
    M: 'middle slice (like L)', E: 'equator slice (like D)', S: 'standing slice (like F)',
    r: 'right two layers', l: 'left two layers', u: 'top two layers',
    d: 'bottom two layers', f: 'front two layers', b: 'back two layers',
    x: 'whole cube (like R)', y: 'whole cube (like U)', z: 'whole cube (like F)',
  }
  const key = /w/.test(move.token) ? letter.toLowerCase() : letter
  const what = names[key] ?? move.token
  const abs = Math.abs(move.quarterTurns)
  const isRotation = 'xyz'.includes(key)
  const verb = isRotation ? 'Rotate the' : 'Turn the'
  if (abs === 2) return `${verb} ${what} twice (180°)`
  const prime = move.token.includes("'")
  return `${verb} ${what} ${prime ? 'counter-clockwise' : 'clockwise'}`
}

// ---------- Faces & facelets (for the 2D net editor) ----------

/** Position of the sticker at row/col (0..2) on a face, viewed head-on in a standard net. */
export function faceletPos(face: FaceKey, row: number, col: number): Vec3 {
  const r = row - 1
  const c = col - 1
  switch (face) {
    case 'U': return [c, 1, r]
    case 'D': return [c, -1, -r]
    case 'F': return [c, -r, 1]
    case 'B': return [-c, -r, -1]
    case 'R': return [1, -r, -c]
    case 'L': return [-1, -r, c]
  }
}

export function getFacelet(state: CubeState, face: FaceKey, row: number, col: number): ColorKey {
  const pos = faceletPos(face, row, col)
  const normal = FACE_NORMALS[face]
  const cubie = state.find((c) => eq(c.pos, pos))
  const sticker = cubie?.stickers.find((s) => eq(s.normal, normal))
  return sticker?.color ?? 'W'
}

export function setFacelet(
  state: CubeState, face: FaceKey, row: number, col: number, color: ColorKey,
): CubeState {
  const pos = faceletPos(face, row, col)
  const normal = FACE_NORMALS[face]
  return state.map((c) =>
    eq(c.pos, pos)
      ? { ...c, stickers: c.stickers.map((s) => (eq(s.normal, normal) ? { ...s, color } : s)) }
      : c,
  )
}

/** Paint one sticker identified by its cubie position and outward normal. */
export function setSticker(state: CubeState, pos: Vec3, normal: Vec3, color: ColorKey): CubeState {
  return state.map((c) =>
    eq(c.pos, pos)
      ? { ...c, stickers: c.stickers.map((s) => (eq(s.normal, normal) ? { ...s, color } : s)) }
      : c,
  )
}

/** True if the sticker is a face center (centers are fixed in the editor). */
export function isCenterSticker(pos: Vec3) {
  return pos.filter((v) => v !== 0).length === 1
}

export function centerColor(state: CubeState, face: FaceKey): ColorKey {
  return getFacelet(state, face, 1, 1)
}

export function colorCounts(state: CubeState): Record<ColorKey, number> {
  const counts = { W: 0, Y: 0, G: 0, B: 0, R: 0, O: 0 } as Record<ColorKey, number>
  for (const c of state) for (const s of c.stickers) counts[s.color]++
  return counts
}

export function isSolved(state: CubeState): boolean {
  return FACE_KEYS.every((face) => {
    const center = centerColor(state, face)
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) if (getFacelet(state, face, r, c) !== center) return false
    return true
  })
}

// ---------- Orientation ----------

const ROTATIONS = ['x', "x'", 'y', "y'", 'z', "z'", 'x2', 'y2', 'z2'].map(parseMove)

/**
 * Shortest whole-cube rotation sequence that puts the given center colors on
 * Up and Front. Returns null if the pair is impossible (e.g. opposite colors).
 */
export function orientationMoves(state: CubeState, up: ColorKey, front: ColorKey): Move[] | null {
  const done = (s: CubeState) => centerColor(s, 'U') === up && centerColor(s, 'F') === front
  if (done(state)) return []
  const key = (s: CubeState) => FACE_KEYS.map((f) => centerColor(s, f)).join('')
  const seen = new Set([key(state)])
  let frontier: { s: CubeState; path: Move[] }[] = [{ s: state, path: [] }]
  for (let depth = 0; depth < 3; depth++) {
    const next: typeof frontier = []
    for (const { s, path } of frontier)
      for (const mv of ROTATIONS) {
        const ns = applyMove(s, mv)
        const k = key(ns)
        if (seen.has(k)) continue
        seen.add(k)
        const np = [...path, mv]
        if (done(ns)) return np
        next.push({ s: ns, path: np })
      }
    frontier = next
  }
  return null
}

/**
 * The position a formula solves: start solved, hold the cube as suggested,
 * then undo the formula. Returned in the default holding (white up, green
 * front) so it can be shown in the color editor.
 */
export function caseState(alg: string, hold?: { up: ColorKey; front: ColorKey }): CubeState {
  const solved = createSolved()
  const orient = hold ? orientationMoves(solved, hold.up, hold.front) ?? [] : []
  const held = applyMoves(applyMoves(solved, orient), invertAlg(parseAlg(alg)))
  return applyMoves(held, invertAlg(orient))
}

export function randomScramble(length = 20): string {
  const faces = ['R', 'L', 'U', 'D', 'F', 'B']
  const suffix = ['', "'", '2']
  const out: string[] = []
  let last = ''
  while (out.length < length) {
    const f = faces[Math.floor(Math.random() * faces.length)]
    if (f === last) continue
    last = f
    out.push(f + suffix[Math.floor(Math.random() * 3)])
  }
  return out.join(' ')
}

// ---------- Single-layer turns (for drag-to-turn) ----------

const LAYER_LETTERS = ['R', 'L', 'U', 'D', 'F', 'B', 'M', 'E', 'S'] as const

/**
 * The standard move for turning one layer: `axis` (0 x, 1 y, 2 z), `layer`
 * (-1, 0 or 1 along that axis) and the turn direction as a right-hand-rule
 * quarter turn around +axis. E.g. layerMove(0, 1, -1) is "R".
 */
export function layerMove(axis: Axis, layer: number, quarterTurns: 1 | -1): Move {
  const letter = LAYER_LETTERS.find((l) => BASE[l].axis === axis && BASE[l].layers[0] === layer)
  if (!letter) throw new Error(`No layer ${layer} on axis ${axis}`)
  return parseMove(quarterTurns === BASE[letter].dir ? letter : `${letter}'`)
}

/** Whole-cube rotations (x, y, z) don't change the puzzle, only how you hold it. */
export const isRotation = (move: Move) => move.layers.length === 3
