import * as THREE from 'three'
import {
  FRICTION, MIN_SPEED, MAX_BALL_SPEED, TABLE_WIDTH, TABLE_LENGTH, BALL_RADIUS,
  POCKET_XZ, POCKET_RADIUS, CUE_TIP_GAP, CUE_LENGTH, PHYSICS_TARGET_FPS, POWER_CUE_OFFSET, CUE_ELEVATION,
} from '../config/constants'
import type { BallState } from '../types/billiards'

export interface StepPhysicsOpts {
  lockedPocketIndices?: Set<number>
  wallRestitution?: number
  frictionOverride?: number
}

export function stepPhysics(balls: BallState[], dt: number, opts?: StepPhysicsOpts) {
  const frictionBase = opts?.frictionOverride ?? FRICTION
  const friction = Math.pow(frictionBase, dt * PHYSICS_TARGET_FPS)
  const wallRestitution = opts?.wallRestitution ?? 0.75
  const maxX = TABLE_WIDTH / 2 - BALL_RADIUS
  const maxZ = TABLE_LENGTH / 2 - BALL_RADIUS
  const diam = BALL_RADIUS * 2

  for (const b of balls) {
    if (!b.active) continue
    if (Math.hypot(b.vx, b.vz) < MIN_SPEED) { b.vx = 0; b.vz = 0; continue }
    b.vx *= friction
    b.vz *= friction
    b.mesh.position.x += b.vx * dt
    b.mesh.position.z += b.vz * dt
  }

  const active = balls.filter(b => b.active)
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j]
      const dx = b.mesh.position.x - a.mesh.position.x
      const dz = b.mesh.position.z - a.mesh.position.z
      const d2 = dx * dx + dz * dz
      if (d2 < diam * diam && d2 > 1e-6) {
        const d = Math.sqrt(d2)
        const nx = dx / d, nz = dz / d
        const imp = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz
        if (imp > 0) {
          a.vx -= imp * nx; a.vz -= imp * nz
          b.vx += imp * nx; b.vz += imp * nz
        }
        const pen = (diam - d) / 2 + 0.0005
        a.mesh.position.x -= pen * nx; a.mesh.position.z -= pen * nz
        b.mesh.position.x += pen * nx; b.mesh.position.z += pen * nz
      }
    }
  }

  for (const b of active) {
    for (let i = 0; i < POCKET_XZ.length; i++) {
      if (opts?.lockedPocketIndices?.has(i)) continue
      const [px, pz] = POCKET_XZ[i]
      if (Math.hypot(b.mesh.position.x - px, b.mesh.position.z - pz) < POCKET_RADIUS * 1.4) {
        b.active = false
        b.mesh.visible = false
        break
      }
    }
  }

  for (const b of balls) {
    if (!b.active) continue
    if (b.mesh.position.x > maxX) { b.mesh.position.x = maxX; b.vx = -Math.abs(b.vx) * wallRestitution }
    if (b.mesh.position.x < -maxX) { b.mesh.position.x = -maxX; b.vx = Math.abs(b.vx) * wallRestitution }
    if (b.mesh.position.z > maxZ) { b.mesh.position.z = maxZ; b.vz = -Math.abs(b.vz) * wallRestitution }
    if (b.mesh.position.z < -maxZ) { b.mesh.position.z = -maxZ; b.vz = Math.abs(b.vz) * wallRestitution }
    const spd = Math.hypot(b.vx, b.vz)
    if (spd > MAX_BALL_SPEED) { const f = MAX_BALL_SPEED / spd; b.vx *= f; b.vz *= f }
  }
}

// Scratch objects reused every frame — never allocate inside positionCue
const _cueEuler = new THREE.Euler(0, 0, Math.PI / 2, 'XYZ')
const _cueQ1 = new THREE.Quaternion()
const _cueQ2 = new THREE.Quaternion()
const _cueSideAxis = new THREE.Vector3()
const _CUE_Y_LIFT = (CUE_LENGTH / 2) * Math.sin(CUE_ELEVATION)

export function positionCue(
  cue: THREE.Mesh,
  origin: THREE.Vector3,
  aimAngle: number,
  strokeOffset: number,
  powerFraction = 0,
) {
  const dist = CUE_TIP_GAP + CUE_LENGTH / 2 + powerFraction * POWER_CUE_OFFSET - strokeOffset
  cue.position.set(
    origin.x + Math.cos(aimAngle) * dist,
    origin.y + _CUE_Y_LIFT,
    origin.z + Math.sin(aimAngle) * dist,
  )
  // Lay cylinder flat pointing toward ball
  _cueEuler.y = -aimAngle
  _cueQ1.setFromEuler(_cueEuler)
  // Tilt butt upward around the aim-perpendicular horizontal axis
  _cueSideAxis.set(-Math.sin(aimAngle), 0, Math.cos(aimAngle))
  _cueQ2.setFromAxisAngle(_cueSideAxis, CUE_ELEVATION)
  cue.quaternion.copy(_cueQ1).premultiply(_cueQ2)
}

export function updateAimLine(line: THREE.Line, from: THREE.Vector3, aimAngle: number) {
  const dx = Math.cos(aimAngle)
  const dz = Math.sin(aimAngle)
  const maxX = TABLE_WIDTH / 2 - BALL_RADIUS
  const maxZ = TABLE_LENGTH / 2 - BALL_RADIUS

  let t = 20
  if (Math.abs(dx) > 1e-5) t = Math.min(t, ((dx > 0 ? maxX : -maxX) - from.x) / dx)
  if (Math.abs(dz) > 1e-5) t = Math.min(t, ((dz > 0 ? maxZ : -maxZ) - from.z) / dz)

  const geo = line.geometry as THREE.BufferGeometry
  const pos = geo.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, from.x, from.y, from.z)
  pos.setXYZ(1, from.x + dx * t, from.y, from.z + dz * t)
  pos.needsUpdate = true
}
