import { describe, it, expect } from 'vitest'
import { tripleTriangle } from './triple-triangle'

describe('tripleTriangle', () => {
  it('a le bon id', () => {
    expect(tripleTriangle.id).toBe('triple_shot_triangle')
  })

  it('coûte 4 pièces', () => {
    expect(tripleTriangle.cost).toBe(5)
  })

  it('crée un buff tripleTriangle', () => {
    expect(tripleTriangle.createBuff().effect).toBe('tripleTriangle')
  })

  it('coûte plus cher que tripleShot', async () => {
    const { tripleShot } = await import('./triple-shot')
    expect(tripleTriangle.cost).toBeGreaterThan(tripleShot.cost)
  })
})
