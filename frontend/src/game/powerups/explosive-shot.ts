import type { PowerUp } from './types'

export const explosiveShot: PowerUp = {
  id: 'explosive_shot',
  name: 'Tir Explosif',
  description: 'La première boule touchée provoque une explosion qui écarte toutes les boules proches',
  cost: 4,
  createBuff: () => ({ effect: 'explosiveShot' }),
}
