import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  TABLE_HEIGHT, BALL_RADIUS,
  CUE_COLOR,
  POCKET_XZ, POCKET_RADIUS,
  CLONE_COUNT, CURVE_PREVIEW_POINTS, INITIAL_AIM_ANGLE, MIN_SHOT_POWER,
} from '../config/constants'
import { createRoom } from '../scene/create-room'
import { createTable } from '../scene/create-table'
import { createBalls } from '../scene/create-balls'
import { createCue } from '../scene/create-cue'
import { createPendantLamps } from '../scene/create-lamps'
import type { BallState } from '../types/billiards'
import { CUE_BALL_GEO, CLONE_CUE_GEO } from './billiards-engine-utils'
import type { EngineObjects, EngineState } from './billiards-engine-types'

const EXPLOSION_RING_POOL = 9

export function buildEngineObjects(mount: HTMLDivElement): EngineObjects {
  const w = mount.clientWidth
  const h = mount.clientHeight

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.85
  mount.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x110c08)
  scene.fog = new THREE.Fog(0x110c08, 10, 22)

  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
  camera.position.set(0, 4, 4)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0xfff0d8, 0.9))
  scene.add(new THREE.HemisphereLight(0xffe0a0, 0x3a1e08, 0.7))
  ;([[-6, 2, -4], [6, 2, -4], [-6, 2, 4], [6, 2, 4]] as [number, number, number][])
    .forEach(([x, y, z]) => {
      const pt = new THREE.PointLight(0xffd090, 0.6, 14, 1.5)
      pt.position.set(x, y, z)
      scene.add(pt)
    })

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance   = 2
  controls.maxDistance   = 12
  controls.maxPolarAngle = Math.PI / 2.1

  createRoom(scene)
  createTable(scene)
  const ballStates = createBalls(scene)
  const cue = createCue(scene)
  createPendantLamps(scene)

  const CUE_Y = TABLE_HEIGHT / 2 + BALL_RADIUS

  const cornerLockMat = new THREE.MeshStandardMaterial({
    color: 0xdd2222, roughness: 1, metalness: 0, transparent: true, opacity: 0.72,
  })
  const middleLockMat = new THREE.MeshStandardMaterial({
    color: 0xff8800, roughness: 1, metalness: 0, transparent: true, opacity: 0.72,
  })
  const lockOverlays: THREE.Mesh[] = POCKET_XZ.map(([px, pz], i) => {
    const mat = i < 4 ? cornerLockMat : middleLockMat
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(POCKET_RADIUS, POCKET_RADIUS, 0.012, 32), mat)
    disc.position.set(px, TABLE_HEIGHT / 2 + 0.006, pz)
    disc.visible = false
    scene.add(disc)
    return disc
  })

  const ringGeo = new THREE.RingGeometry(0.85, 1.0, 48)
  const explosionRings = Array.from({ length: EXPLOSION_RING_POOL }, () => {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff7700, transparent: true, opacity: 0, side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeo, mat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = TABLE_HEIGHT / 2 + 0.004
    ring.visible = false
    scene.add(ring)
    return ring
  })

  const aimGeo = new THREE.BufferGeometry()
  aimGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const aimLine = new THREE.Line(
    aimGeo,
    new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true }),
  )
  scene.add(aimLine)

  const curveAimGeo = new THREE.BufferGeometry()
  curveAimGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CURVE_PREVIEW_POINTS * 3), 3))
  const curveAimMat = new THREE.LineBasicMaterial({ color: 0xffaa44, opacity: 0.5, transparent: true })
  const curveAimLine = new THREE.Line(curveAimGeo, curveAimMat)
  curveAimLine.visible = false
  scene.add(curveAimLine)

  const ghostBallMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2, roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.28,
  })
  const ghostCueMat = new THREE.MeshStandardMaterial({
    color: CUE_COLOR, roughness: 0.4, metalness: 0.1, transparent: true, opacity: 0.42,
  })
  const ghostAimMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.14, transparent: true })

  const ghostBalls: THREE.Mesh[] = []
  const ghostCues: THREE.Mesh[] = []
  const ghostAimLines: THREE.Line[] = []

  for (let i = 0; i < CLONE_COUNT; i++) {
    const ball = new THREE.Mesh(CUE_BALL_GEO, ghostBallMat)
    ball.visible = false
    scene.add(ball)
    ghostBalls.push(ball)

    const ghostCue = new THREE.Mesh(CLONE_CUE_GEO, ghostCueMat)
    ghostCue.visible = false
    scene.add(ghostCue)
    ghostCues.push(ghostCue)

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    const line = new THREE.Line(geo, ghostAimMat)
    line.visible = false
    scene.add(line)
    ghostAimLines.push(line)
  }

  return {
    mount, renderer, scene, camera, controls,
    clock: new THREE.Clock(),
    ballStates, cue, aimLine, curveAimLine, curveAimGeo,
    lockOverlays, explosionRings, ghostBalls, ghostCues, ghostAimLines,
    CUE_Y, ringGeo, ghostBallMat, ghostCueMat, ghostAimMat,
    cornerLockMat, middleLockMat, curveAimMat,
  }
}

export function createEngineState(ballStates: BallState[]): EngineState {
  return {
    phase: 'aiming',
    aimAngle: INITIAL_AIM_ANGLE,
    shotPower: MIN_SHOT_POWER,
    shotAnim: -1,
    shotOrigin: new THREE.Vector3(),
    activeBeforeShot: ballStates.slice(1).filter(b => b.active).length,
    extraCueBalls: [],
    cloneData: null,
    explosionFiredBy: new Set(),
    explosionVisuals: [],
    clonedBallsThisShot: new Set(),
    seismeRemaining: 0,
  }
}
