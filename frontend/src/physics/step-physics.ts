import * as THREE from 'three'
import {
  FRICTION, MIN_SPEED, TABLE_WIDTH, TABLE_LENGTH, BALL_RADIUS,
  POCKET_XZ, POCKET_RADIUS, CUE_TIP_GAP, CUE_LENGTH,
} from '../config/constants'
import type { BallState } from '../types/billiards'

export function stepPhysics(balls: BallState[], dt: number, lockedPocketIndices?: Set<number>) {
  const friction = Math.pow(FRICTION, dt * 60)
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
      if (lockedPocketIndices?.has(i)) continue
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
    if (b.mesh.position.x > maxX) { b.mesh.position.x = maxX; b.vx = -Math.abs(b.vx) * 0.75 }
    if (b.mesh.position.x < -maxX) { b.mesh.position.x = -maxX; b.vx = Math.abs(b.vx) * 0.75 }
    if (b.mesh.position.z > maxZ) { b.mesh.position.z = maxZ; b.vz = -Math.abs(b.vz) * 0.75 }
    if (b.mesh.position.z < -maxZ) { b.mesh.position.z = -maxZ; b.vz = Math.abs(b.vz) * 0.75 }
  }
}

export function positionCue(cue: THREE.Mesh, origin: THREE.Vector3, aimAngle: number, strokeOffset: number) {
  const dist = CUE_TIP_GAP + CUE_LENGTH / 2 - strokeOffset
  cue.position.set(
    origin.x - Math.cos(aimAngle) * dist,
    origin.y,
    origin.z - Math.sin(aimAngle) * dist,
  )
  cue.rotation.set(0, Math.PI - aimAngle, Math.PI / 2)
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
