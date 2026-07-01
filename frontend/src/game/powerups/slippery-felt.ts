import type { PowerUp } from './types'

export const slipperyFelt: PowerUp = {
  id: 'slippery_felt',
  name: 'Tapis Glissant',
  description: 'Friction très réduite ce tour — les boules roulent beaucoup plus loin',
  cost: 2,
  createBuff: () => ({ effect: 'slipperyFelt' }),
}
