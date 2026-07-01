import type { PowerUp } from './types'

export const lockCornerPockets: PowerUp = {
  id: 'lock_corner_pockets',
  name: 'Coins Verrouillés',
  description: 'Bloque les 4 trous de coin pour ce tour',
  cost: 2,
  createBuff: () => ({ effect: 'lockCornerPockets' }),
}
