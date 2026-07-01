import type { PowerUp } from './types'

export const lockMiddlePockets: PowerUp = {
  id: 'lock_middle_pockets',
  name: 'Milieux Verrouillés',
  description: 'Bloque les 2 trous du milieu pour ce tour',
  cost: 1,
  createBuff: () => ({ effect: 'lockMiddlePockets' }),
}
