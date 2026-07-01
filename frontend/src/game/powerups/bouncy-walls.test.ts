import { describe, it, expect } from 'vitest'
import { bouncyWalls } from './bouncy-walls'

describe('bouncyWalls', () => {
  it('a le bon id', () => {
    expect(bouncyWalls.id).toBe('bouncy_walls')
  })

  it('coûte 3 pièces', () => {
    expect(bouncyWalls.cost).toBe(3)
  })

  it('crée un buff bouncyWalls', () => {
    expect(bouncyWalls.createBuff().effect).toBe('bouncyWalls')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(bouncyWalls.createBuff()).not.toBe(bouncyWalls.createBuff())
  })
})
