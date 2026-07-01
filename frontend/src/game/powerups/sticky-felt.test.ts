import { describe, it, expect } from 'vitest'
import { stickyFelt } from './sticky-felt'

describe('stickyFelt', () => {
  it('a le bon id', () => {
    expect(stickyFelt.id).toBe('sticky_felt')
  })

  it('coûte 1 pièce', () => {
    expect(stickyFelt.cost).toBe(1)
  })

  it('crée un buff stickyFelt', () => {
    expect(stickyFelt.createBuff().effect).toBe('stickyFelt')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(stickyFelt.createBuff()).not.toBe(stickyFelt.createBuff())
  })
})
