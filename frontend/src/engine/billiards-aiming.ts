import * as THREE from 'three'
import { AIM_SPEED, CLONE_COUNT, EXPLOSION_RADIUS } from '../config/constants'
import { positionCue, updateAimLine } from '../physics/step-physics'
import { buildCurveAimPositions, buildCloneData } from './billiards-engine-utils'
import type { EngineObjects, EngineState, EngineCallbacks } from './billiards-engine-types'

export function handleAiming(
  objects: EngineObjects,
  state: EngineState,
  callbacks: EngineCallbacks,
  keys: Set<string>,
  dt: number,
): void {
  if (keys.has('ArrowLeft') || keys.has('a')) state.aimAngle -= AIM_SPEED * dt
  if (keys.has('ArrowRight') || keys.has('d')) state.aimAngle += AIM_SPEED * dt

  const cb = objects.ballStates[0]
  if (cb.active) {
    const curveEffect = callbacks.activeEffects.has('curveLeft') ? 'curveLeft'
      : callbacks.activeEffects.has('curveRight') ? 'curveRight'
      : null
    objects.cue.visible = true
    positionCue(objects.cue, cb.mesh.position, state.aimAngle, 0)
    if (curveEffect) {
      objects.aimLine.visible = false
      objects.curveAimLine.visible = true
      const sign = curveEffect === 'curveLeft' ? 1 : -1
      const pts = buildCurveAimPositions(
        cb.mesh.position.x, cb.mesh.position.z, objects.CUE_Y + 0.002,
        state.aimAngle, sign,
      )
      const pos = objects.curveAimGeo.attributes.position as THREE.BufferAttribute
      pos.array.set(pts)
      pos.needsUpdate = true
    } else {
      objects.aimLine.visible = true
      objects.curveAimLine.visible = false
      updateAimLine(
        objects.aimLine,
        new THREE.Vector3(cb.mesh.position.x, objects.CUE_Y + 0.002, cb.mesh.position.z),
        state.aimAngle,
      )
    }
  } else {
    objects.cue.visible = false
    objects.aimLine.visible = false
    objects.curveAimLine.visible = false
  }

  const cloneActive = cb.active && callbacks.activeEffects.has('clone')
  if (cloneActive && state.cloneData === null) state.cloneData = buildCloneData(objects.ballStates)

  for (let i = 0; i < CLONE_COUNT; i++) {
    const show = cloneActive && state.cloneData !== null && i < state.cloneData.positions.length
    objects.ghostBalls[i].visible = show
    objects.ghostCues[i].visible  = show
    objects.ghostAimLines[i].visible = show
    if (show && state.cloneData) {
      const [gx, gz] = state.cloneData.positions[i]
      const angle = state.aimAngle + state.cloneData.angles[i]
      const ballPos = new THREE.Vector3(gx, objects.CUE_Y, gz)
      objects.ghostBalls[i].position.set(gx, objects.CUE_Y, gz)
      positionCue(objects.ghostCues[i], ballPos, angle, 0)
      updateAimLine(objects.ghostAimLines[i], new THREE.Vector3(gx, objects.CUE_Y + 0.002, gz), angle)
    }
  }

  const effects = callbacks.activeEffects
  objects.lockOverlays.forEach((disc, i) => {
    disc.visible = (i < 4 && effects.has('lockCornerPockets')) || (i >= 4 && effects.has('lockMiddlePockets'))
  })
}

export function updateExplosionVisuals(objects: EngineObjects, state: EngineState, dt: number): void {
  for (let i = state.explosionVisuals.length - 1; i >= 0; i--) {
    const v = state.explosionVisuals[i]
    const ring = objects.explosionRings[v.ringIndex]
    ring.visible = true
    ring.scale.setScalar(EXPLOSION_RADIUS * Math.max(v.progress, 0.01))
    ;(ring.material as THREE.MeshBasicMaterial).opacity = 0.72 * (1 - v.progress)
    if (v.progress >= 1) {
      ring.visible = false
      state.explosionVisuals.splice(i, 1)
    } else {
      v.progress = Math.min(v.progress + dt / 0.4, 1)
    }
  }
}
