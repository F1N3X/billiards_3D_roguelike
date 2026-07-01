import { describe, it, expect } from 'vitest'
import { PowerUpRegistry } from './registry'

describe('PowerUpRegistry', () => {
  it('liste tous les power-ups enregistrés', () => {
    expect(PowerUpRegistry.all().length).toBeGreaterThan(0)
  })

  it('retourne triple_shot par id', () => {
    const pu = PowerUpRegistry.get('triple_shot')
    expect(pu.id).toBe('triple_shot')
  })

  it('retourne triple_shot_triangle par id', () => {
    const pu = PowerUpRegistry.get('triple_shot_triangle')
    expect(pu.id).toBe('triple_shot_triangle')
  })

  it('lève une erreur pour un id inconnu', () => {
    // @ts-expect-error id invalide intentionnel
    expect(() => PowerUpRegistry.get('inexistant')).toThrow('[PowerUpRegistry]')
  })


})
