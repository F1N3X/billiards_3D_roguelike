import type { PowerUp } from './types'

export const seisme: PowerUp = {
  id: 'seisme',
  name: 'Séisme',
  description: 'Au tir, toutes les boules colorées reçoivent une impulsion aléatoire',
  cost: 2,
  createBuff: () => ({ effect: 'seisme' }),
}
