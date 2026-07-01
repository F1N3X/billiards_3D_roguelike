import type { PowerUp } from './types'

export const curveRight: PowerUp = {
  id: 'curve_right',
  name: 'Tir Courbé Droite',
  description: 'La(les) blanche(s) dévient en arc de cercle vers la droite',
  cost: 2,
  createBuff: () => ({ effect: 'curveRight' }),
}
