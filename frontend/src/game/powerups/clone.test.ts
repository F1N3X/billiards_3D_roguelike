import { describe, it, expect } from 'vitest'
import { clone } from './clone'

describe('clone', () => {
  it('a le bon id', () => {
    expect(clone.id).toBe('clone')
  })

  it('coûte 5 pièces', () => {
    expect(clone.cost).toBe(5)
  })

  it('coûte plus cher que tripleTriangle', async () => {
    const { tripleTriangle } = await import('./triple-triangle')
    expect(clone.cost).toBeGreaterThan(tripleTriangle.cost)
  })

  it('crée un buff clone', () => {
    expect(clone.createBuff().effect).toBe('clone')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(clone.createBuff()).not.toBe(clone.createBuff())
  })

  it('a un icon non vide', () => {
    expect(clone.icon.length).toBeGreaterThan(0)
  })
})
