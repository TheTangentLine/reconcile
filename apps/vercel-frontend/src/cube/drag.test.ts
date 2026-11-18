import { describe, expect, it } from 'vitest'
import { moveFromDrag, type Project } from './drag'
import { layerMove } from './model'

// A camera looking straight at the front face (+z): screen x = world x, screen y = -world y.
const front: Project = ([x, y]) => [x * 100, -y * 100]
// Looking straight down at the top face (+y), with the front (+z) at the bottom of the screen.
const top: Project = ([x, , z]) => [x * 100, z * 100]

const RIGHT: [number, number] = [40, 0]
const LEFT: [number, number] = [-40, 0]
const UP: [number, number] = [0, -40]
const DOWN: [number, number] = [0, 40]

const token = (...a: Parameters<typeof moveFromDrag>) => moveFromDrag(...a).token

describe('moveFromDrag', () => {
  it('dragging the front-right column up is R', () => {
    expect(token([1, 0, 1], [0, 0, 1], [1, 0, 1.5], UP, front)).toBe('R')
    expect(token([1, 0, 1], [0, 0, 1], [1, 0, 1.5], DOWN, front)).toBe("R'")
  })

  it('dragging the front-left column down is L', () => {
    expect(token([-1, 1, 1], [0, 0, 1], [-1, 1, 1.5], DOWN, front)).toBe('L')
  })

  it('dragging the top row of the front to the left is U', () => {
    expect(token([0, 1, 1], [0, 0, 1], [0, 1, 1.5], LEFT, front)).toBe('U')
    expect(token([0, 1, 1], [0, 0, 1], [0, 1, 1.5], RIGHT, front)).toBe("U'")
  })

  it('dragging the bottom row to the right is D', () => {
    expect(token([1, -1, 1], [0, 0, 1], [1, -1, 1.5], RIGHT, front)).toBe('D')
  })

  it('middle row and column turn the slices', () => {
    expect(token([0, 0, 1], [0, 0, 1], [0, 0, 1.5], RIGHT, front)).toBe('E')
    expect(token([0, 0, 1], [0, 0, 1], [0, 0, 1.5], DOWN, front)).toBe('M')
  })

  it('dragging on the top face turns F and R as expected', () => {
    // Front row of the top face, dragged to the right: F (clockwise seen from the front).
    expect(token([0, 1, 1], [0, 1, 0], [0, 1.5, 1], RIGHT, top)).toBe('F')
    // Right column of the top face, dragged towards the back (up on screen): R.
    expect(token([1, 1, 0], [0, 1, 0], [1, 1.5, 0], UP, top)).toBe('R')
  })

  it('a diagonal drag snaps to the closest direction', () => {
    expect(token([1, 0, 1], [0, 0, 1], [1, 0, 1.5], [6, -40], front)).toBe('R')
  })
})

describe('layerMove', () => {
  it('names every outer and slice layer', () => {
    expect(layerMove(0, 1, -1).token).toBe('R')
    expect(layerMove(0, -1, 1).token).toBe('L')
    expect(layerMove(0, 0, 1).token).toBe('M')
    expect(layerMove(1, 1, -1).token).toBe('U')
    expect(layerMove(1, 0, -1).token).toBe("E'")
    expect(layerMove(2, 1, 1).token).toBe("F'")
    expect(layerMove(2, 0, -1).token).toBe('S')
    expect(layerMove(2, -1, 1).token).toBe('B')
  })
})
