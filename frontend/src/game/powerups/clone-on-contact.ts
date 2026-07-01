import type { PowerUp } from './types'

export const cloneOnContact: PowerUp = {
  id: 'clone_on_contact',
  name: 'Clonage au contact',
  description: 'Chaque boule touchée par la blanche génère un clone sur la table',
  cost: 3,
  createBuff: () => ({ effect: 'cloneOnContact' }),
}
