import { describe, it, expect } from 'vitest'
import { tripleShot } from './triple-shot'

describe('tripleShot', () => {
  it('a le bon id', () => {
    expect(tripleShot.id).toBe('triple_shot')
  })

  it('coûte 3 pièces', () => {
    expect(tripleShot.cost).toBe(3)
  })

  it('crée un buff tripleShot', () => {
    expect(tripleShot.createBuff().effect).toBe('tripleShot')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(tripleShot.createBuff()).not.toBe(tripleShot.createBuff())
  })
})
