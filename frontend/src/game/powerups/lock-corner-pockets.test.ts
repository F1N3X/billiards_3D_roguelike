import { describe, it, expect } from 'vitest'
import { lockCornerPockets } from './lock-corner-pockets'

describe('lockCornerPockets', () => {
  it('a le bon id', () => {
    expect(lockCornerPockets.id).toBe('lock_corner_pockets')
  })

  it('coûte 3 pièces', () => {
    expect(lockCornerPockets.cost).toBe(3)
  })

  it('crée un buff lockCornerPockets', () => {
    expect(lockCornerPockets.createBuff().effect).toBe('lockCornerPockets')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(lockCornerPockets.createBuff()).not.toBe(lockCornerPockets.createBuff())
  })

  it('a une icône non vide', () => {
    expect(lockCornerPockets.icon.length).toBeGreaterThan(0)
  })
})
