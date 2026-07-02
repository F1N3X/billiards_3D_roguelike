import { describe, it, expect } from 'vitest'
import { computeShotScore, computeVictoryBonus } from './score'

describe('computeShotScore', () => {
  it('retourne 0 pour aucune boule empochée sans scratch', () => {
    expect(computeShotScore(0, false)).toBe(0)
  })

  it('retourne SCORE_PER_BALL (100) pour 1 boule empochée', () => {
    expect(computeShotScore(1, false)).toBe(100)
  })

  it('applique le bonus combo : 2 boules = 100 + 150 = 250', () => {
    expect(computeShotScore(2, false)).toBe(250)
  })

  it('applique le bonus combo : 3 boules = 100 + 150 + 200 = 450', () => {
    expect(computeShotScore(3, false)).toBe(450)
  })

  it('applique la pénalité scratch seule', () => {
    expect(computeShotScore(0, true)).toBe(-200)
  })

  it('cumule boules empochées et pénalité scratch', () => {
    expect(computeShotScore(1, true)).toBe(100 - 200)
  })

  it('retourne 0 quand ballsPotted est 0 et scratch est false', () => {
    expect(computeShotScore(0, false)).toBe(0)
  })
})

describe('computeVictoryBonus', () => {
  it('retourne VICTORY_BASE_BONUS (2000) pour 0 coups', () => {
    expect(computeVictoryBonus(0)).toBe(2000)
  })

  it('diminue de VICTORY_BONUS_PER_SHOT (100) par coup', () => {
    expect(computeVictoryBonus(5)).toBe(1500)
    expect(computeVictoryBonus(10)).toBe(1000)
    expect(computeVictoryBonus(20)).toBe(0)
  })

  it('ne descend jamais en dessous de 0', () => {
    expect(computeVictoryBonus(100)).toBe(0)
    expect(computeVictoryBonus(999)).toBe(0)
  })
})
