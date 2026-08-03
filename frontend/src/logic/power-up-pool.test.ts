import { describe, it, expect } from 'vitest'
import { drawHand, drawHandKeepingSlots } from './power-up-pool'
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

describe('drawHandKeepingSlots', () => {
  it('sans slots verrouillés, se comporte comme drawHand', () => {
    const base = drawHand()
    const hand = drawHandKeepingSlots(base, new Set())
    expect(hand.length).toBeLessThanOrEqual(RUMBLE_HAND_SIZE)
    expect(hand.length).toBeGreaterThan(0)
  })

  it('conserve les cartes verrouillées à leurs indices exacts', () => {
    const base = drawHand()
    const lockedIndices = new Set([0, 2])
    const hand = drawHandKeepingSlots(base, lockedIndices)
    expect(hand[0].id).toBe(base[0].id)
    expect(hand[2].id).toBe(base[2].id)
  })

  it('les slots non verrouillés reçoivent de nouvelles cartes (IDs exclus des verrouillés)', () => {
    const base = drawHand()
    const lockedIndices = new Set([1])
    const lockedId = base[1].id
    const hand = drawHandKeepingSlots(base, lockedIndices)
    const newSlots = hand.filter((_, i) => i !== 1)
    for (const p of newSlots) {
      expect(p.id).not.toBe(lockedId)
    }
  })

  it('ne contient pas de doublons', () => {
    const base = drawHand()
    const hand = drawHandKeepingSlots(base, new Set([0, 3]))
    const ids = hand.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ne dépasse pas RUMBLE_HAND_SIZE', () => {
    const base = drawHand()
    const hand = drawHandKeepingSlots(base, new Set([0, 1, 2, 3]))
    expect(hand.length).toBeLessThanOrEqual(RUMBLE_HAND_SIZE)
  })

  it('si tous les slots sont verrouillés, retourne exactement la main courante', () => {
    const base = drawHand()
    const all = new Set(base.map((_, i) => i))
    const hand = drawHandKeepingSlots(base, all)
    expect(hand.map(p => p.id)).toEqual(base.map(p => p.id))
  })
})
