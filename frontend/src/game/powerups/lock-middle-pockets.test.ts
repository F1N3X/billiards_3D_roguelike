import { describe, it, expect } from 'vitest'
import { lockMiddlePockets } from './lock-middle-pockets'

describe('lockMiddlePockets', () => {
  it('a le bon id', () => {
    expect(lockMiddlePockets.id).toBe('lock_middle_pockets')
  })

  it('coûte 2 pièces', () => {
    expect(lockMiddlePockets.cost).toBe(2)
  })

  it('crée un buff lockMiddlePockets', () => {
    expect(lockMiddlePockets.createBuff().effect).toBe('lockMiddlePockets')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(lockMiddlePockets.createBuff()).not.toBe(lockMiddlePockets.createBuff())
  })


})
