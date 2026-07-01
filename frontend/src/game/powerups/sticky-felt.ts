import type { PowerUp } from './types'

export const stickyFelt: PowerUp = {
  id: 'sticky_felt',
  name: 'Tapis Collant',
  description: 'Friction très augmentée ce tour — les boules s\'arrêtent rapidement',
  cost: 1,
  createBuff: () => ({ effect: 'stickyFelt' }),
}
