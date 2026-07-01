import { describe, it, expect } from 'vitest'
import { cloneOnContact } from './clone-on-contact'

describe('cloneOnContact', () => {
  it('a le bon id', () => {
    expect(cloneOnContact.id).toBe('clone_on_contact')
  })

  it('coûte 3 pièces', () => {
    expect(cloneOnContact.cost).toBe(3)
  })

  it('crée un buff cloneOnContact', () => {
    expect(cloneOnContact.createBuff().effect).toBe('cloneOnContact')
  })

  it('createBuff retourne une nouvelle instance à chaque appel', () => {
    expect(cloneOnContact.createBuff()).not.toBe(cloneOnContact.createBuff())
  })

  it('a une icône non vide', () => {
    expect(cloneOnContact.icon.length).toBeGreaterThan(0)
  })

  it('a une description non vide', () => {
    expect(cloneOnContact.description.length).toBeGreaterThan(0)
  })
})
