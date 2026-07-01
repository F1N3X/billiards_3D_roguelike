import type { PowerUp } from './types'

export const magneticCue: PowerUp = {
  id: 'magnetic_cue',
  name: 'Boule Magnétique',
  description: 'La(les) boule(s) blanche(s) attirent les boules colorées proches',
  cost: 3,
  createBuff: () => ({ effect: 'magneticCue' }),
}
