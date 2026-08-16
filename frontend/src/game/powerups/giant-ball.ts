import type { PowerUp } from './types'

export const giantBall: PowerUp = {
  id: 'giant_ball',
  name: 'Boule Géante',
  description: 'La boule blanche grossit : trop grande pour les poches, masse massive, inertie difficile à stopper.',
  cost: 4,
  createBuff: () => ({ effect: 'giantBall' }),
}
