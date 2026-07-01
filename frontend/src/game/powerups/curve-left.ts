import type { PowerUp } from './types'

export const curveLeft: PowerUp = {
  id: 'curve_left',
  name: 'Tir Courbé Gauche',
  description: 'La(les) blanche(s) dévient en arc de cercle vers la gauche',
  cost: 2,
  createBuff: () => ({ effect: 'curveLeft' }),
}
