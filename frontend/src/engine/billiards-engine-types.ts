import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { BallState } from '../types/billiards'
import type { BuffEffect } from '../game/powerups'

export interface CloneData {
  positions: [number, number][]
  angles: number[]
}

export interface EngineCallbacks {
  onShotResolved: (ballsPotted: number, scratch: boolean, isVictory: boolean) => void
  onRollingChange?: (rolling: boolean) => void
  activeEffects: Set<BuffEffect>
}

export interface EngineObjects {
  mount: HTMLDivElement
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  clock: THREE.Clock
  ballStates: BallState[]
  cue: THREE.Mesh
  aimLine: THREE.Line
  curveAimLine: THREE.Line
  curveAimGeo: THREE.BufferGeometry
  lockOverlays: THREE.Mesh[]
  explosionRings: THREE.Mesh[]
  ghostBalls: THREE.Mesh[]
  ghostCues: THREE.Mesh[]
  ghostAimLines: THREE.Line[]
  CUE_Y: number
  // kept for explicit disposal
  ringGeo: THREE.RingGeometry
  ghostBallMat: THREE.MeshStandardMaterial
  ghostCueMat: THREE.MeshStandardMaterial
  ghostAimMat: THREE.LineBasicMaterial
  cornerLockMat: THREE.MeshStandardMaterial
  middleLockMat: THREE.MeshStandardMaterial
  curveAimMat: THREE.LineBasicMaterial
}

export interface EngineState {
  phase: 'aiming' | 'rolling' | 'victory'
  aimAngle: number
  shotAnim: number
  shotOrigin: THREE.Vector3
  activeBeforeShot: number
  extraCueBalls: BallState[]
  cloneData: CloneData | null
  explosionFiredBy: Set<THREE.Mesh>
  explosionVisuals: Array<{ progress: number; ringIndex: number }>
  clonedBallsThisShot: Set<THREE.Mesh>
  seismeRemaining: number
}
