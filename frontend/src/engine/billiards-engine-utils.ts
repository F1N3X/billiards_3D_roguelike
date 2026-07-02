import * as THREE from 'three'
import {
  TABLE_WIDTH, TABLE_LENGTH, BALL_RADIUS, CUE_LENGTH,
  POCKET_XZ, POCKET_RADIUS,
  SHOT_POWER, CURVE_FORCE, CURVE_PREVIEW_POINTS,
  CLONE_COUNT,
  EXPLOSION_RADIUS, EXPLOSION_FORCE,
  BOUNCY_WALLS_RESTITUTION, SLIPPERY_FRICTION, STICKY_FRICTION,
} from '../config/constants'
import type { BallState } from '../types/billiards'
import type { BuffEffect } from '../game/powerups'
import type { CloneData, EngineObjects, EngineState } from './billiards-engine-types'

export const CUE_BALL_GEO = new THREE.SphereGeometry(BALL_RADIUS, 32, 32)
export const CLONE_CUE_GEO = new THREE.CylinderGeometry(0.015, 0.03, CUE_LENGTH, 16)
export const SPAWN_GAP = BALL_RADIUS * 2.4
export const MIN_CLONE_DIST = BALL_RADIUS * 3.2

export function tryPlaceClone(
  existing: BallState[],
  placed: [number, number][],
): [number, number] | null {
  const maxX = TABLE_WIDTH  / 2 - BALL_RADIUS * 2
  const maxZ = TABLE_LENGTH / 2 - BALL_RADIUS * 2
  for (let attempt = 0; attempt < 120; attempt++) {
    const x = (Math.random() * 2 - 1) * maxX
    const z = (Math.random() * 2 - 1) * maxZ
    const clearOfBalls   = existing.filter(b => b.active)
      .every(b => Math.hypot(b.mesh.position.x - x, b.mesh.position.z - z) >= MIN_CLONE_DIST)
    const clearOfClones  = placed
      .every(([px, pz]) => Math.hypot(px - x, pz - z) >= MIN_CLONE_DIST)
    const clearOfPockets = POCKET_XZ
      .every(([px, pz]) => Math.hypot(px - x, pz - z) >= POCKET_RADIUS * 2.5)
    if (clearOfBalls && clearOfClones && clearOfPockets) return [x, z]
  }
  return null
}

export function buildCurveAimPositions(
  startX: number, startZ: number, y: number,
  aimAngle: number, sign: number,
): Float32Array {
  const R = SHOT_POWER / CURVE_FORCE
  const arcSpan = Math.PI / 2
  const pts = new Float32Array(CURVE_PREVIEW_POINTS * 3)
  const cx = startX - Math.sin(aimAngle) * sign * R
  const cz = startZ + Math.cos(aimAngle) * sign * R
  const startAngle = aimAngle - sign * Math.PI / 2
  for (let i = 0; i < CURVE_PREVIEW_POINTS; i++) {
    const t = i / (CURVE_PREVIEW_POINTS - 1)
    const a = startAngle + sign * t * arcSpan
    pts[i * 3]     = cx + Math.cos(a) * R
    pts[i * 3 + 1] = y
    pts[i * 3 + 2] = cz + Math.sin(a) * R
  }
  return pts
}

export function buildLockedPocketIndices(effects: Set<BuffEffect>): Set<number> | undefined {
  const indices = new Set<number>()
  if (effects.has('lockCornerPockets')) [0, 1, 2, 3].forEach(i => indices.add(i))
  if (effects.has('lockMiddlePockets')) [4, 5].forEach(i => indices.add(i))
  return indices.size > 0 ? indices : undefined
}

export function buildStepPhysicsOpts(effects: Set<BuffEffect>) {
  return {
    lockedPocketIndices: buildLockedPocketIndices(effects),
    wallRestitution: effects.has('bouncyWalls') ? BOUNCY_WALLS_RESTITUTION : undefined,
    frictionOverride: effects.has('slipperyFelt') ? SLIPPERY_FRICTION
      : effects.has('stickyFelt') ? STICKY_FRICTION
      : undefined,
  }
}

export function applyExplosion(balls: BallState[], cx: number, cz: number) {
  for (const b of balls) {
    if (!b.active) continue
    const dx = b.mesh.position.x - cx
    const dz = b.mesh.position.z - cz
    const dist = Math.hypot(dx, dz)
    if (dist >= EXPLOSION_RADIUS || dist < 1e-4) continue
    const factor = EXPLOSION_FORCE * (1 - dist / EXPLOSION_RADIUS)
    b.vx += (dx / dist) * factor
    b.vz += (dz / dist) * factor
  }
}

export function buildCloneData(existing: BallState[]): CloneData {
  const positions: [number, number][] = []
  const angles: number[] = []
  for (let i = 0; i < CLONE_COUNT; i++) {
    const pos = tryPlaceClone(existing, positions)
    if (pos) positions.push(pos)
    angles.push(Math.random() * Math.PI * 2)
  }
  return { positions, angles }
}

export function makeExtraCueBall(
  scene: THREE.Scene,
  x: number, y: number, z: number,
  vx: number, vz: number,
): BallState {
  const mesh = new THREE.Mesh(
    CUE_BALL_GEO,
    new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.15, metalness: 0.05 }),
  )
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  scene.add(mesh)
  return { mesh, vx, vz, active: true }
}

export function cleanupExtraCueBalls(objects: EngineObjects, state: EngineState) {
  for (const extra of state.extraCueBalls) objects.scene.remove(extra.mesh)
  state.extraCueBalls = []
}

export function hideGhosts(objects: EngineObjects) {
  for (let i = 0; i < CLONE_COUNT; i++) {
    objects.ghostBalls[i].visible = false
    objects.ghostCues[i].visible = false
    objects.ghostAimLines[i].visible = false
  }
}
