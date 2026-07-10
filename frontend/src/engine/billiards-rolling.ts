import * as THREE from 'three'
import {
  TABLE_HEIGHT, TABLE_WIDTH, BALL_RADIUS,
  CURVE_FORCE, MAGNET_FORCE, MAGNET_RADIUS,
  SEISME_IMPULSE_PER_SEC, MIN_SPEED, MAX_SHOT_POWER,
} from '../config/constants'
import { positionCue, stepPhysics } from '../physics/step-physics'
import type { BallState } from '../types/billiards'
import {
  buildStepPhysicsOpts, applyExplosion, tryPlaceClone,
  cleanupExtraCueBalls, hideGhosts,
} from './billiards-engine-utils'
import type { EngineObjects, EngineState, EngineCallbacks } from './billiards-engine-types'

export function handleRolling(
  objects: EngineObjects,
  state: EngineState,
  callbacks: EngineCallbacks,
  dt: number,
): void {
  hideGhosts(objects)

  const effects = callbacks.activeEffects
  const physicsOpts = buildStepPhysicsOpts(effects)

  if (effects.has('curveLeft') || effects.has('curveRight')) {
    const sign = effects.has('curveLeft') ? 1 : -1
    const cueBalls = [objects.ballStates[0], ...state.extraCueBalls].filter(b => b.active)
    for (const cueBall of cueBalls) {
      const ovx = cueBall.vx
      cueBall.vx += (-cueBall.vz) * sign * CURVE_FORCE * dt
      cueBall.vz += ( ovx) * sign * CURVE_FORCE * dt
    }
  }

  stepPhysics([...objects.ballStates, ...state.extraCueBalls], dt, physicsOpts)

  if (effects.has('magneticCue')) {
    const cueBalls = [objects.ballStates[0], ...state.extraCueBalls].filter(b => b.active)
    for (const colored of objects.ballStates.slice(1)) {
      if (!colored.active) continue
      let nearest: BallState | null = null
      let nearestDist = Infinity
      for (const white of cueBalls) {
        const dx = white.mesh.position.x - colored.mesh.position.x
        const dz = white.mesh.position.z - colored.mesh.position.z
        const dist = Math.hypot(dx, dz)
        if (dist >= BALL_RADIUS * 5 && dist < MAGNET_RADIUS && dist < nearestDist) {
          nearest = white
          nearestDist = dist
        }
      }
      if (nearest) {
        const mdx = nearest.mesh.position.x - colored.mesh.position.x
        const mdz = nearest.mesh.position.z - colored.mesh.position.z
        const factor = MAGNET_FORCE * (1 - nearestDist / MAGNET_RADIUS) * dt
        colored.vx += (mdx / nearestDist) * factor
        colored.vz += (mdz / nearestDist) * factor
      }
    }
  }

  if (state.seismeRemaining > 0) {
    for (const ball of objects.ballStates.slice(1)) {
      if (!ball.active) continue
      const angle = Math.random() * Math.PI * 2
      ball.vx += Math.cos(angle) * SEISME_IMPULSE_PER_SEC * dt
      ball.vz += Math.sin(angle) * SEISME_IMPULSE_PER_SEC * dt
    }
    state.seismeRemaining = Math.max(0, state.seismeRemaining - dt)
  }

  if (effects.has('explosiveShot')) {
    const cueBalls = [objects.ballStates[0], ...state.extraCueBalls].filter(b => b.active)
    const CONTACT_THRESHOLD = BALL_RADIUS * 2 * 1.15
    for (const cueBall of cueBalls) {
      if (state.explosionFiredBy.has(cueBall.mesh)) continue
      for (const target of objects.ballStates.slice(1)) {
        if (!target.active) continue
        const dist = Math.hypot(
          target.mesh.position.x - cueBall.mesh.position.x,
          target.mesh.position.z - cueBall.mesh.position.z,
        )
        if (dist < CONTACT_THRESHOLD) {
          const ecx = cueBall.mesh.position.x
          const ecz = cueBall.mesh.position.z
          applyExplosion([...objects.ballStates, ...state.extraCueBalls], ecx, ecz)
          state.explosionFiredBy.add(cueBall.mesh)
          const usedRings = new Set(state.explosionVisuals.map(v => v.ringIndex))
          const ringIdx = objects.explosionRings.findIndex((_, i) => !usedRings.has(i))
          if (ringIdx >= 0) {
            objects.explosionRings[ringIdx].position.set(ecx, TABLE_HEIGHT / 2 + 0.004, ecz)
            state.explosionVisuals.push({ progress: 0, ringIndex: ringIdx })
          }
          break
        }
      }
    }
  }

  if (effects.has('cloneOnContact')) {
    const cueBalls = [objects.ballStates[0], ...state.extraCueBalls].filter(b => b.active)
    const CONTACT_DIST = BALL_RADIUS * 2 * 1.15
    for (const cueBall of cueBalls) {
      for (const target of objects.ballStates.slice(1)) {
        if (!target.active || state.clonedBallsThisShot.has(target.mesh)) continue
        const dist = Math.hypot(
          target.mesh.position.x - cueBall.mesh.position.x,
          target.mesh.position.z - cueBall.mesh.position.z,
        )
        if (dist < CONTACT_DIST) {
          const pos = tryPlaceClone(objects.ballStates, [])
          if (pos) {
            const cloneMesh = new THREE.Mesh(
              target.mesh.geometry,
              (target.mesh.material as THREE.MeshStandardMaterial).clone(),
            )
            cloneMesh.position.set(pos[0], objects.CUE_Y, pos[1])
            cloneMesh.castShadow = true
            objects.scene.add(cloneMesh)
            objects.ballStates.push({ mesh: cloneMesh, vx: 0, vz: 0, active: true })
            state.activeBeforeShot += 1
            state.clonedBallsThisShot.add(target.mesh)
            state.clonedBallsThisShot.add(cloneMesh)
          }
        }
      }
    }
  }

  if (state.shotAnim >= 0) {
    state.shotAnim = Math.min(state.shotAnim + dt / 0.12, 1)
    positionCue(objects.cue, state.shotOrigin, state.aimAngle, state.shotAnim * 0.25, state.shotPower / MAX_SHOT_POWER)
    objects.cue.visible = state.shotAnim < 1
    if (state.shotAnim >= 1) state.shotAnim = -1
  } else {
    objects.cue.visible = false
  }
  objects.aimLine.visible = false
  objects.curveAimLine.visible = false

  const cb = objects.ballStates[0]
  const allBalls = [...objects.ballStates, ...state.extraCueBalls]
  const allStopped = allBalls.filter(b => b.active).every(b => Math.hypot(b.vx, b.vz) < MIN_SPEED)

  if (allStopped) {
    allBalls.forEach(b => { b.vx = 0; b.vz = 0 })
    const coloredNow = objects.ballStates.slice(1).filter(b => b.active).length
    const ballsPotted = state.activeBeforeShot - coloredNow

    const anyWhiteAlive = cb.active || state.extraCueBalls.some(b => b.active)
    const scratch = !anyWhiteAlive

    if (!cb.active && !scratch) {
      const survivor = state.extraCueBalls.find(b => b.active)!
      cb.active = true
      cb.mesh.visible = true
      cb.mesh.position.copy(survivor.mesh.position)
      cb.vx = 0
      cb.vz = 0
    }

    cleanupExtraCueBalls(objects, state)
    state.clonedBallsThisShot.clear()

    const isVictory = coloredNow === 0
    callbacks.onShotResolved(ballsPotted, scratch, isVictory)

    if (isVictory) {
      state.phase = 'victory'
      objects.cue.visible = false
      objects.aimLine.visible = false
      objects.curveAimLine.visible = false
      objects.controls.autoRotate = true
      objects.controls.autoRotateSpeed = 10
      callbacks.onRollingChange?.(false)
    } else {
      if (scratch) {
        cb.active = true
        cb.mesh.visible = true
        cb.mesh.position.set(-TABLE_WIDTH / 4, objects.CUE_Y, 0)
        cb.vx = 0
        cb.vz = 0
      }
      state.phase = 'aiming'
      callbacks.onRollingChange?.(false)
    }
  }
}
