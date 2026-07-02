import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { stepPhysics } from './step-physics'
import { BALL_RADIUS, MIN_SPEED, POCKET_XZ } from '../config/constants'
import type { BallState } from '../types/billiards'

function makeBall(x: number, z: number, vx = 0, vz = 0): BallState {
  const mesh = new THREE.Mesh()
  mesh.position.set(x, 0, z)
  return { mesh, vx, vz, active: true }
}

describe('stepPhysics', () => {
  it('déplace une boule selon sa vitesse', () => {
    const ball = makeBall(0, 0, 2, 0)
    stepPhysics([ball], 0.016)
    expect(ball.mesh.position.x).toBeGreaterThan(0)
  })

  it('stoppe une boule sous le seuil MIN_SPEED', () => {
    const ball = makeBall(0, 0, MIN_SPEED * 0.5, 0)
    stepPhysics([ball], 0.016)
    expect(ball.vx).toBe(0)
    expect(ball.vz).toBe(0)
  })

  it('applique la friction (vitesse décroît)', () => {
    const ball = makeBall(0, 0, 5, 0)
    const vBefore = ball.vx
    stepPhysics([ball], 0.016)
    expect(ball.vx).toBeLessThan(vBefore)
  })

  it('rebondit sur le mur droit (vx devient négatif)', () => {
    const ball = makeBall(2.3, 0, 5, 0)
    stepPhysics([ball], 0.016)
    expect(ball.vx).toBeLessThan(0)
  })

  it('rebondit sur le mur gauche (vx devient positif)', () => {
    const ball = makeBall(-2.3, 0, -5, 0)
    stepPhysics([ball], 0.016)
    expect(ball.vx).toBeGreaterThan(0)
  })

  it('rebondit sur le mur arrière (vz devient négatif)', () => {
    const ball = makeBall(0, 1.3, 0, 5)
    stepPhysics([ball], 0.016)
    expect(ball.vz).toBeLessThan(0)
  })

  it('désactive une boule qui entre dans une poche', () => {
    const [px, pz] = POCKET_XZ[0]
    const ball = makeBall(px, pz, 0.1, 0.1)
    stepPhysics([ball], 0.016)
    expect(ball.active).toBe(false)
    expect(ball.mesh.visible).toBe(false)
  })

  it('respecte les poches verrouillées — boule non désactivée', () => {
    const [px, pz] = POCKET_XZ[0]
    const ball = makeBall(px, pz, 0.1, 0.1)
    stepPhysics([ball], 0.016, { lockedPocketIndices: new Set([0]) })
    expect(ball.active).toBe(true)
  })

  it('ignore les boules inactives', () => {
    const ball = makeBall(0, 0, 5, 0)
    ball.active = false
    const xBefore = ball.mesh.position.x
    stepPhysics([ball], 0.016)
    expect(ball.mesh.position.x).toBe(xBefore)
  })

  it('transfère la vitesse lors d\'une collision entre deux boules', () => {
    const a = makeBall(0, 0, 3, 0)
    const b = makeBall(BALL_RADIUS * 1.5, 0, 0, 0)
    stepPhysics([a, b], 0.016)
    expect(a.vx).toBeLessThan(3)
    expect(b.vx).toBeGreaterThan(0)
  })

  it('applique wallRestitution personnalisée', () => {
    const ball = makeBall(2.3, 0, 5, 0)
    stepPhysics([ball], 0.016, { wallRestitution: 1.3 })
    expect(Math.abs(ball.vx)).toBeGreaterThan(5 * 0.74)
  })
})
