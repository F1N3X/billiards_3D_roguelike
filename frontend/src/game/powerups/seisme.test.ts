import { describe, it, expect } from 'vitest'
import { seisme } from './seisme'

describe('seisme', () => {
  it('a le bon id', () => {
    expect(seisme.id).toBe('seisme')
  })

  it('coûte 3 pièces', () => {
    expect(seisme.cost).toBe(2)
  })

  it('crée un buff seisme', () => {
    expect(seisme.createBuff().effect).toBe('seisme')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(seisme.createBuff()).not.toBe(seisme.createBuff())
  })
})
