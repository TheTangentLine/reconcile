import { Router } from 'express'
import { getFormula, getMethod, listMethods } from '../controllers/methods.controller.js'

export const methodsRouter = Router()

methodsRouter.get('/', listMethods)
methodsRouter.get('/:slug', getMethod)
methodsRouter.get('/:slug/formulas/:formulaId', getFormula)
