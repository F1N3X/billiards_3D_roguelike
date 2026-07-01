import type { PowerUp } from './types'

export const tripleTriangle: PowerUp = {
  id: 'triple_shot_triangle',
  name: 'Triangle',
  description: '3 boules en triangle : 1 en pointe, 2 en éventail',
  cost: 5,
  createBuff: () => ({ effect: 'tripleTriangle' }),
}
