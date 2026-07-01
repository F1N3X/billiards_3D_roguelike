import { describe, it, expect } from 'vitest'
import { curveLeft } from './curve-left'

describe('curveLeft', () => {
  it('a le bon id', () => {
    expect(curveLeft.id).toBe('curve_left')
  })

  it('coûte 2 pièces', () => {
    expect(curveLeft.cost).toBe(2)
  })

  it('crée un buff curveLeft', () => {
    expect(curveLeft.createBuff().effect).toBe('curveLeft')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(curveLeft.createBuff()).not.toBe(curveLeft.createBuff())
  })
})
