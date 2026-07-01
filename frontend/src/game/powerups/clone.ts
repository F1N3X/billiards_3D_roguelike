import type { PowerUp } from './types'

export const clone: PowerUp = {
  id: 'clone',
  name: 'Clone',
  description: '4 boules fantômes, chacune avec sa propre queue',
  cost: 4,
  icon: '✦',
  createBuff: () => ({ effect: 'clone' }),
}
