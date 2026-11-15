// Bundled method and formula data. This app has no backend: everything ships
// in the JavaScript bundle.
//
// Copied from the backend seed (apps/backend/src/seed/methods.ts). When you
// change formulas there, copy them here too (or the other way around).
import type { Method } from '../api/types'

const YELLOW_UP = { up: 'Y', front: 'G' } as const
const WHITE_UP = { up: 'W', front: 'G' } as const

export const METHODS: Method[] = [
  {
    slug: 'beginner',
    letter: 'B',
    accent: '#ffd23f',
    face: 'GWGWWWGWG',
    name: 'Absolute Beginner',
    tagline: 'Layer by layer, with just a few short formulas.',
    level: 'Beginner',
    avgMoves: '~110',
    summary:
      'The easiest way to solve the cube for the first time. You build the white side first, then the middle layer, then finish the yellow side. Every step uses one short formula you can learn in minutes.',
    stages: [
      {
        id: 'cross',
        name: '1. White cross',
        goal: 'Make a white plus sign on the top, with each edge matching its side center.',
        formulas: [
          {
            id: 'cross-flip',
            name: 'Flip a wrong-way edge',
            alg: "F U' R U",
            description: 'The white edge is in the right spot but its white sticker faces the front. This flips it in place.',
            hold: WHITE_UP,
          },
          {
            id: 'cross-insert',
            name: 'Bring an edge up',
            alg: 'F2',
            description: 'The white edge is in the bottom layer under its matching center. Turn the front twice to bring it up.',
            hold: WHITE_UP,
          },
        ],
      },
      {
        id: 'corners',
        name: '2. White corners',
        goal: 'Fill in the four white corners to finish the first layer.',
        formulas: [
          {
            id: 'sexy',
            name: 'Corner insert ("R U R\' U\'")',
            alg: "R U R' U'",
            description: 'Hold the white side on the bottom. Put the corner above its slot, front-right, and repeat this until the corner is solved.',
            hold: YELLOW_UP,
          },
        ],
      },
      {
        id: 'middle',
        name: '3. Middle layer',
        goal: 'Insert the four edges of the middle layer.',
        formulas: [
          {
            id: 'edge-right',
            name: 'Edge to the right',
            alg: "U R U' R' U' F' U F",
            description: 'The edge in the top layer belongs to the slot on the front-right.',
            hold: YELLOW_UP,
          },
          {
            id: 'edge-left',
            name: 'Edge to the left',
            alg: "U' L' U L U F U' F'",
            description: 'The edge in the top layer belongs to the slot on the front-left.',
            hold: YELLOW_UP,
          },
        ],
      },
      {
        id: 'yellow-cross',
        name: '4. Yellow cross',
        goal: 'Make a yellow plus sign on top (edges only, sides do not need to match yet).',
        formulas: [
          {
            id: 'ycross',
            name: 'Yellow cross',
            alg: "F R U R' U' F'",
            description: 'Do it from a dot, an L-shape (held at the back-left), or a line (held horizontally).',
            hold: YELLOW_UP,
          },
        ],
      },
      {
        id: 'yellow-face',
        name: '5. Yellow side',
        goal: 'Make the whole top yellow.',
        formulas: [
          {
            id: 'sune',
            name: 'Sune',
            alg: "R U R' U R U2 R'",
            description: 'Rotates three corners. Repeat with a fresh setup until the whole top is yellow.',
            hold: YELLOW_UP,
          },
        ],
      },
      {
        id: 'last',
        name: '6. Final layer',
        goal: 'Move the last corners and edges into place.',
        formulas: [
          {
            id: 'corner-cycle',
            name: 'Cycle corners',
            alg: "U R U' L' U R' U' L",
            description: 'Swaps three corners in a loop, keeping the front-right one in place.',
            hold: YELLOW_UP,
          },
          {
            id: 'edge-cycle',
            name: 'Cycle edges',
            alg: "R U' R U R U R U' R' U' R2",
            description: 'Swaps three edges in a loop, keeping the back edge in place.',
            hold: YELLOW_UP,
          },
        ],
      },
    ],
  },
  {
    slug: 'cfop',
    letter: 'C',
    accent: '#4f86f0',
    face: 'RYGYYYBYO',
    name: 'CFOP',
    tagline: 'Cross, F2L, OLL, PLL: the method most speedcubers use.',
    level: 'Intermediate',
    avgMoves: '~55',
    summary:
      'CFOP builds the cross, then solves the first two layers together in pairs (F2L), then orients (OLL) and permutes (PLL) the last layer. Start with 2-look OLL/PLL and add more cases over time.',
    stages: [
      {
        id: 'f2l',
        name: 'F2L: basic inserts',
        goal: 'Pair a corner with its edge in the top layer, then insert them together.',
        formulas: [
          { id: 'f2l-1', name: 'Pair ready, right', alg: "U R U' R'", description: 'Corner and edge are already joined above the slot.', hold: YELLOW_UP },
          { id: 'f2l-2', name: 'Pair ready, left', alg: "U' F' U F", description: 'Mirror of the case before it, inserted from the front.', hold: YELLOW_UP },
          { id: 'f2l-3', name: 'Split pair, right', alg: "R U R'", description: 'Corner is above the slot, edge is at the back.', hold: YELLOW_UP },
          { id: 'f2l-4', name: 'Split pair, front', alg: "F' U' F", description: 'Corner is above the slot, edge is on the left.', hold: YELLOW_UP },
        ],
      },
      {
        id: 'oll',
        name: 'OLL (2-look)',
        goal: 'Make the whole top face yellow.',
        formulas: [
          { id: 'oll-line', name: 'Line', alg: "F R U R' U' F'", description: 'Edges: line to cross.', hold: YELLOW_UP },
          { id: 'oll-l', name: 'L-shape', alg: "f R U R' U' f'", description: 'Edges: L-shape to cross.', hold: YELLOW_UP },
          { id: 'oll-sune', name: 'Sune', alg: "R U R' U R U2 R'", description: 'One corner is yellow, at the front-left.', hold: YELLOW_UP },
          { id: 'oll-antisune', name: 'Anti-Sune', alg: "R U2 R' U' R U' R'", description: 'One corner is yellow, at the back-right.', hold: YELLOW_UP },
          { id: 'oll-h', name: 'H', alg: "F R U R' U' R U R' U' R U R' U' F'", description: 'No yellow corners on top, with headlights on both sides.', hold: YELLOW_UP },
          { id: 'oll-pi', name: 'Pi', alg: "R U2 R2 U' R2 U' R2 U2 R", description: 'No yellow corners on top, with a bar on the left.', hold: YELLOW_UP },
          { id: 'oll-headlights', name: 'Headlights', alg: "R2 D R' U2 R D' R' U2 R'", description: 'Two yellow corners on top, with headlights at the back.', hold: YELLOW_UP },
        ],
      },
      {
        id: 'pll',
        name: 'PLL (2-look)',
        goal: 'Move the last-layer pieces into place to finish the solve.',
        formulas: [
          { id: 'pll-t', name: 'T-perm', alg: "R U R' U' R' F R2 U' R' U' R U R' F'", description: 'Swaps two corners (and two edges). Headlights go on the left.', hold: YELLOW_UP },
          { id: 'pll-y', name: 'Y-perm', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", description: 'Swaps two corners diagonally.', hold: YELLOW_UP },
          { id: 'pll-ua', name: 'Ua-perm', alg: "R U' R U R U R U' R' U' R2", description: 'Cycles three edges, with the solved bar at the back.', hold: YELLOW_UP },
          { id: 'pll-ub', name: 'Ub-perm', alg: "R2 U R U R' U' R' U' R' U R'", description: 'Cycles three edges the other way.', hold: YELLOW_UP },
          { id: 'pll-h', name: 'H-perm', alg: 'M2 U M2 U2 M2 U M2', description: 'Swaps opposite edges.', hold: YELLOW_UP },
          { id: 'pll-z', name: 'Z-perm', alg: "M2 U M2 U M' U2 M2 U2 M' U2",description: 'Swaps adjacent edges.', hold: YELLOW_UP },
        ],
      },
    ],
  },
  {
    slug: 'roux',
    letter: 'R',
    accent: '#ef5a3c',
    face: 'OWGOYGOWG',
    name: 'Roux',
    tagline: 'Block building and middle-slice moves. Very few turns.',
    level: 'Advanced',
    avgMoves: '~48',
    summary:
      'Roux builds a 1x2x3 block on each side, solves the top corners with CMLL, and finishes the six remaining edges using mostly M and U moves.',
    stages: [
      {
        id: 'cmll',
        name: 'CMLL (sample)',
        goal: 'Solve the four top corners without caring about the middle slice.',
        formulas: [
          { id: 'cmll-sune', name: 'Sune', alg: "R U R' U R U2 R'", description: 'Sample CMLL case.', hold: YELLOW_UP },
          { id: 'cmll-antisune', name: 'Anti-Sune', alg: "R U2 R' U' R U' R'", description: 'Sample CMLL case.', hold: YELLOW_UP },
        ],
      },
      {
        id: 'lse',
        name: 'LSE (sample)',
        goal: 'Solve the last six edges with M and U moves.',
        formulas: [
          { id: 'lse-ep', name: 'Edge 3-cycle', alg: "M' U2 M U2", description: 'Cycles three edges using only M and U.', hold: YELLOW_UP },
        ],
      },
    ],
  },
  {
    slug: 'zz',
    letter: 'Z',
    accent: '#d9d4c7',
    face: 'WGWGGGWGW',
    name: 'ZZ',
    tagline: 'Orient edges first, then solve with R, U, and L only.',
    level: 'Advanced',
    avgMoves: '~50',
    summary: 'Coming soon.',
    stages: [],
    comingSoon: true,
  },
]

