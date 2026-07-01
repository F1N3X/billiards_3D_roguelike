import type { PowerUp } from './types'

export const bouncyWalls: PowerUp = {
  id: 'bouncy_walls',
  name: 'Bandes Rebondissantes',
  description: 'Les bandes renvoient toutes les boules à 1,5× leur vitesse ce tour',
  cost: 2,
  createBuff: () => ({ effect: 'bouncyWalls' }),
}
