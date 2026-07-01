import { describe, it, expect } from 'vitest'
import { magneticCue } from './magnetic-cue'

describe('magneticCue', () => {
  it('a le bon id', () => {
    expect(magneticCue.id).toBe('magnetic_cue')
  })

  it('coûte 3 pièces', () => {
    expect(magneticCue.cost).toBe(3)
  })

  it('crée un buff magneticCue', () => {
    expect(magneticCue.createBuff().effect).toBe('magneticCue')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(magneticCue.createBuff()).not.toBe(magneticCue.createBuff())
  })
})
