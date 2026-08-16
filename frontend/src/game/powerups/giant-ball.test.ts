import { describe, it, expect } from 'vitest'
import { giantBall } from './giant-ball'

describe('giantBall', () => {
  it('a le bon id', () => {
    expect(giantBall.id).toBe('giant_ball')
  })

  it('crée un buff avec l\'effet giantBall', () => {
    expect(giantBall.createBuff().effect).toBe('giantBall')
  })

  it('a un coût positif', () => {
    expect(giantBall.cost).toBeGreaterThan(0)
  })
})
