import { describe, it, expect } from 'vitest'
import { drawHand } from './power-up-pool'
import { RUMBLE_HAND_SIZE } from '../config/power-ups'
import { PowerUpRegistry } from '../game/powerups'

describe('drawHand', () => {
  it('retourne un tableau', () => {
    expect(Array.isArray(drawHand())).toBe(true)
  })

  it('retourne au plus RUMBLE_HAND_SIZE power-ups', () => {
    const hand = drawHand()
    expect(hand.length).toBeLessThanOrEqual(RUMBLE_HAND_SIZE)
  })

  it('retourne une main non vide', () => {
    expect(drawHand().length).toBeGreaterThan(0)
  })

  it('ne contient pas de doublons (ids uniques)', () => {
    const hand = drawHand()
    const ids = hand.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('chaque power-up est présent dans le registry', () => {
    const hand = drawHand()
    for (const powerUp of hand) {
      expect(() => PowerUpRegistry.get(powerUp.id)).not.toThrow()
    }
  })

  it('chaque power-up possède les champs requis', () => {
    const hand = drawHand()
    for (const powerUp of hand) {
      expect(typeof powerUp.id).toBe('string')
      expect(typeof powerUp.name).toBe('string')
      expect(typeof powerUp.description).toBe('string')
      expect(typeof powerUp.cost).toBe('number')
      expect(typeof powerUp.createBuff).toBe('function')
    }
  })

  it('createBuff retourne un objet avec un champ effect', () => {
    const hand = drawHand()
    for (const powerUp of hand) {
      const buff = powerUp.createBuff()
      expect(typeof buff.effect).toBe('string')
    }
  })
})
