import { SEISME_DURATION } from '../config/constants'
import { SPAWN_GAP, makeExtraCueBall, hideGhosts } from './billiards-engine-utils'
import type { EngineObjects, EngineState, EngineCallbacks } from './billiards-engine-types'

export function fireShot(objects: EngineObjects, state: EngineState, callbacks: EngineCallbacks): void {
  const cb = objects.ballStates[0]
  if (!cb.active || state.phase !== 'aiming') return

  state.activeBeforeShot = objects.ballStates.slice(1).filter(b => b.active).length
  state.shotOrigin.copy(cb.mesh.position)
  state.explosionFiredBy.clear()
  state.explosionVisuals = []

  const shotAngle = state.aimAngle + Math.PI
  const dx = Math.cos(shotAngle)
  const dz = Math.sin(shotAngle)
  const px = -dz
  const pz =  dx
  const effects = callbacks.activeEffects

  let mainSpawns: Array<{ ox: number; oz: number; da: number }> = [{ ox: 0, oz: 0, da: 0 }]

  if (effects.has('tripleShot')) {
    mainSpawns = mainSpawns.flatMap(s => [
      s,
      { ...s, ox: s.ox - dx * SPAWN_GAP,      oz: s.oz - dz * SPAWN_GAP      },
      { ...s, ox: s.ox - dx * SPAWN_GAP * 2,  oz: s.oz - dz * SPAWN_GAP * 2  },
    ])
  }

  if (effects.has('tripleTriangle')) {
    mainSpawns = mainSpawns.flatMap(s => [
      s,
      { ...s, ox: s.ox - dx * SPAWN_GAP + px * SPAWN_GAP, oz: s.oz - dz * SPAWN_GAP + pz * SPAWN_GAP },
      { ...s, ox: s.ox - dx * SPAWN_GAP - px * SPAWN_GAP, oz: s.oz - dz * SPAWN_GAP - pz * SPAWN_GAP },
    ])
  }

  if (effects.has('seisme')) state.seismeRemaining = SEISME_DURATION

  cb.vx = dx * state.shotPower
  cb.vz = dz * state.shotPower
  state.phase = 'rolling'
  state.shotAnim = 0
  callbacks.onRollingChange?.(true)

  const originX = cb.mesh.position.x
  const originZ = cb.mesh.position.z
  for (let i = 1; i < mainSpawns.length; i++) {
    const { ox, oz, da } = mainSpawns[i]
    const angle = shotAngle + da
    state.extraCueBalls.push(makeExtraCueBall(
      objects.scene, originX + ox, objects.CUE_Y, originZ + oz,
      Math.cos(angle) * state.shotPower, Math.sin(angle) * state.shotPower,
    ))
  }

  if (effects.has('clone') && state.cloneData) {
    for (let c = 0; c < state.cloneData.positions.length; c++) {
      const [cx, cz] = state.cloneData.positions[c]
      const cAngle = shotAngle + state.cloneData.angles[c]
      const cdx = Math.cos(cAngle)
      const cdz = Math.sin(cAngle)
      const cpx = -cdz
      const cpz =  cdx

      let cloneSpawns: Array<{ ox: number; oz: number; da: number }> = [{ ox: 0, oz: 0, da: 0 }]

      if (effects.has('tripleShot')) {
        cloneSpawns = cloneSpawns.flatMap(s => [
          s,
          { ...s, ox: s.ox - cdx * SPAWN_GAP,      oz: s.oz - cdz * SPAWN_GAP      },
          { ...s, ox: s.ox - cdx * SPAWN_GAP * 2,  oz: s.oz - cdz * SPAWN_GAP * 2  },
        ])
      }

      if (effects.has('tripleTriangle')) {
        cloneSpawns = cloneSpawns.flatMap(s => [
          s,
          { ...s, ox: s.ox - cdx * SPAWN_GAP + cpx * SPAWN_GAP, oz: s.oz - cdz * SPAWN_GAP + cpz * SPAWN_GAP },
          { ...s, ox: s.ox - cdx * SPAWN_GAP - cpx * SPAWN_GAP, oz: s.oz - cdz * SPAWN_GAP - cpz * SPAWN_GAP },
        ])
      }

      for (const { ox, oz, da } of cloneSpawns) {
        const angle = cAngle + da
        state.extraCueBalls.push(makeExtraCueBall(
          objects.scene, cx + ox, objects.CUE_Y, cz + oz,
          Math.cos(angle) * state.shotPower, Math.sin(angle) * state.shotPower,
        ))
      }
    }
    state.cloneData = null
  }

  hideGhosts(objects)
}
