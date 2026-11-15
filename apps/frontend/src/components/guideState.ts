import { useState } from 'react'
import { createSolved, type ColorKey, type CubeState } from '../cube/model'
import type { Formula, Method } from '../data/methods'

export type GuideStep = 1 | 2 | 3
export interface Hold { up: ColorKey; front: ColorKey }

export interface GuideState {
  step: GuideStep
  setStep: (s: GuideStep) => void
  cube: CubeState
  setCube: (c: CubeState) => void
  formula: Formula | undefined
  hold: Hold
  setHold: (h: Hold) => void
  selectFormula: (f: Formula) => void
  pixel: boolean
  setPixel: (p: boolean) => void
}

const DEFAULT_HOLD: Hold = { up: 'W', front: 'G' }

export function useGuideState(method: Method): GuideState {
  const first = method.stages[0]?.formulas[0]
  const [step, setStep] = useState<GuideStep>(1)
  const [cube, setCube] = useState<CubeState>(createSolved)
  const [formula, setFormula] = useState<Formula | undefined>(first)
  const [hold, setHold] = useState<Hold>(first?.hold ?? DEFAULT_HOLD)
  const [pixel, setPixel] = useState(false)
  return {
    step, setStep, cube, setCube, formula, hold, setHold, pixel, setPixel,
    selectFormula: (f) => {
      setFormula(f)
      setHold(f.hold ?? DEFAULT_HOLD)
    },
  }
}
