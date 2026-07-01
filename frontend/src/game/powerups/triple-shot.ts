import type { PowerUp } from './types'

export const tripleShot: PowerUp = {
  id: 'triple_shot',
  name: 'Triple Tir',
  description: '3 boules blanches en ligne derrière le tir',
  cost: 3,
  createBuff: () => ({ effect: 'tripleShot' }),
}
