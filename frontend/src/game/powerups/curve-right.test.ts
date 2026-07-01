import { describe, it, expect } from 'vitest'
import { curveRight } from './curve-right'

describe('curveRight', () => {
  it('a le bon id', () => {
    expect(curveRight.id).toBe('curve_right')
  })

  it('coûte 2 pièces', () => {
    expect(curveRight.cost).toBe(2)
  })

  it('crée un buff curveRight', () => {
    expect(curveRight.createBuff().effect).toBe('curveRight')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(curveRight.createBuff()).not.toBe(curveRight.createBuff())
  })
})
