import { describe, it, expect } from 'vitest'
import { explosiveShot } from './explosive-shot'

describe('explosiveShot', () => {
  it('a le bon id', () => {
    expect(explosiveShot.id).toBe('explosive_shot')
  })

  it('coûte 4 pièces', () => {
    expect(explosiveShot.cost).toBe(4)
  })

  it('crée un buff explosiveShot', () => {
    expect(explosiveShot.createBuff().effect).toBe('explosiveShot')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(explosiveShot.createBuff()).not.toBe(explosiveShot.createBuff())
  })


})
