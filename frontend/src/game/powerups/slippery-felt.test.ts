import { describe, it, expect } from 'vitest'
import { slipperyFelt } from './slippery-felt'

describe('slipperyFelt', () => {
  it('a le bon id', () => {
    expect(slipperyFelt.id).toBe('slippery_felt')
  })

  it('coûte 2 pièces', () => {
    expect(slipperyFelt.cost).toBe(1)
  })

  it('crée un buff slipperyFelt', () => {
    expect(slipperyFelt.createBuff().effect).toBe('slipperyFelt')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(slipperyFelt.createBuff()).not.toBe(slipperyFelt.createBuff())
  })
})
