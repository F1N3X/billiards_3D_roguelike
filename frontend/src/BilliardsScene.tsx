import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  TABLE_WIDTH, TABLE_HEIGHT, TABLE_LENGTH, BALL_RADIUS,
  CUE_COLOR, CUE_LENGTH,
  SHOT_POWER, AIM_SPEED, INITIAL_AIM_ANGLE, MIN_SPEED,
  POCKET_XZ, POCKET_RADIUS,
  CLONE_COUNT,
  EXPLOSION_RADIUS, EXPLOSION_FORCE,
  SEISME_IMPULSE_PER_SEC, SEISME_DURATION,
  CURVE_FORCE, CURVE_PREVIEW_POINTS,
  BOUNCY_WALLS_RESTITUTION,
  SLIPPERY_FRICTION,
  STICKY_FRICTION,
  MAGNET_FORCE, MAGNET_RADIUS,
} from './config/constants'
import { createRoom } from './scene/create-room'
import { createTable } from './scene/create-table'
import { createBalls } from './scene/create-balls'
import { createCue } from './scene/create-cue'
import { createPendantLamps } from './scene/create-lamps'
import { stepPhysics, positionCue, updateAimLine } from './physics/step-physics'
import type { BallState } from './types/billiards'
import type { BuffEffect } from './game/powerups'

interface Props {
  onShotResolved: (ballsPotted: number, scratch: boolean, isVictory: boolean) => void
  onRollingChange?: (rolling: boolean) => void
  activeEffects?: Set<BuffEffect>
}

interface CloneData {
  positions: [number, number][]
  angles: number[]
}

const CUE_BALL_GEO = new THREE.SphereGeometry(BALL_RADIUS, 32, 32)
const CLONE_CUE_GEO = new THREE.CylinderGeometry(0.015, 0.03, CUE_LENGTH, 16)
const SPAWN_GAP = BALL_RADIUS * 2.4
const MIN_CLONE_DIST = BALL_RADIUS * 3.2

function tryPlaceClone(
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

function buildCurveAimPositions(
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

function buildLockedPocketIndices(effects: Set<BuffEffect>): Set<number> | undefined {
  const indices = new Set<number>()
  if (effects.has('lockCornerPockets')) [0, 1, 2, 3].forEach(i => indices.add(i))
  if (effects.has('lockMiddlePockets')) [4, 5].forEach(i => indices.add(i))
  return indices.size > 0 ? indices : undefined
}

function buildStepPhysicsOpts(effects: Set<BuffEffect>) {
  return {
    lockedPocketIndices: buildLockedPocketIndices(effects),
    wallRestitution: effects.has('bouncyWalls') ? BOUNCY_WALLS_RESTITUTION : undefined,
    frictionOverride: effects.has('slipperyFelt') ? SLIPPERY_FRICTION
      : effects.has('stickyFelt') ? STICKY_FRICTION
      : undefined,
  }
}

function applyExplosion(balls: BallState[], cx: number, cz: number) {
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

function buildCloneData(existing: BallState[]): CloneData {
  const positions: [number, number][] = []
  const angles: number[] = []
  for (let i = 0; i < CLONE_COUNT; i++) {
    const pos = tryPlaceClone(existing, positions)
    if (pos) positions.push(pos)
    angles.push(Math.random() * Math.PI * 2)
  }
  return { positions, angles }
}

function makeExtraCueBall(
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

export default function BilliardsScene({ onShotResolved, onRollingChange, activeEffects }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onShotResolved)
  callbackRef.current = onShotResolved
  const onRollingChangeRef = useRef(onRollingChange)
  onRollingChangeRef.current = onRollingChange
  const activeEffectsRef = useRef<Set<BuffEffect>>(new Set())
  activeEffectsRef.current = activeEffects ?? new Set()

  useEffect(() => {
    const mount = mountRef.current!
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
    ;([[-6, 2, -4], [6, 2, -4], [-6, 2, 4], [6, 2, 4]] as [number,number,number][])
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

    // ── Pocket lock overlays (one disc per pocket, hidden by default) ─────────
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

    // ── Explosion ring pool (one ring per concurrent explosion) ──────────────
    const EXPLOSION_RING_POOL = 9
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

    // ── Clone ghost objects (hidden by default) ──────────────────────────────
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

    const CUE_Y = TABLE_HEIGHT / 2 + BALL_RADIUS

    const state = {
      phase: 'aiming' as 'aiming' | 'rolling' | 'victory',
      aimAngle: INITIAL_AIM_ANGLE,
      shotAnim: -1,
      shotOrigin: new THREE.Vector3(),
      activeBeforeShot: ballStates.slice(1).filter(b => b.active).length,
      extraCueBalls: [] as BallState[],
      cloneData: null as CloneData | null,
      explosionFiredBy: new Set<THREE.Mesh>(),
      explosionVisuals: [] as Array<{ progress: number; ringIndex: number }>,
      clonedBallsThisShot: new Set<THREE.Mesh>(),
      seismeRemaining: 0,
    }

    function cleanupExtraCueBalls() {
      for (const extra of state.extraCueBalls) scene.remove(extra.mesh)
      state.extraCueBalls = []
    }

    function hideGhosts() {
      for (let i = 0; i < CLONE_COUNT; i++) {
        ghostBalls[i].visible = false
        ghostCues[i].visible = false
        ghostAimLines[i].visible = false
      }
    }

    const keys = new Set<string>()

    const raycaster = new THREE.Raycaster()
    const tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -CUE_Y)
    const intersection = new THREE.Vector3()

    function fireShot() {
      const cb = ballStates[0]
      if (!cb.active || state.phase !== 'aiming') return

      state.activeBeforeShot = ballStates.slice(1).filter(b => b.active).length
      state.shotOrigin.copy(cb.mesh.position)
      state.explosionFiredBy.clear()
      state.explosionVisuals = []

      const dx  = Math.cos(state.aimAngle)
      const dz  = Math.sin(state.aimAngle)
      const px  = -dz
      const pz  =  dx
      const effects = activeEffectsRef.current

      // ── Main spawns: tripleShot / tripleTriangle applied to original aim ──
      let mainSpawns: Array<{ ox: number; oz: number; da: number }> = [{ ox: 0, oz: 0, da: 0 }]

      if (effects.has('tripleShot')) {
        mainSpawns = mainSpawns.flatMap(s => [
          s,
          { ...s, ox: s.ox - dx * SPAWN_GAP,     oz: s.oz - dz * SPAWN_GAP     },
          { ...s, ox: s.ox - dx * SPAWN_GAP * 2,  oz: s.oz - dz * SPAWN_GAP * 2 },
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

      cb.vx = dx * SHOT_POWER
      cb.vz = dz * SHOT_POWER
      state.phase = 'rolling'
      state.shotAnim = 0
      onRollingChangeRef.current?.(true)

      const originX = cb.mesh.position.x
      const originZ = cb.mesh.position.z
      for (let i = 1; i < mainSpawns.length; i++) {
        const { ox, oz, da } = mainSpawns[i]
        const angle = state.aimAngle + da
        state.extraCueBalls.push(makeExtraCueBall(
          scene, originX + ox, CUE_Y, originZ + oz,
          Math.cos(angle) * SHOT_POWER, Math.sin(angle) * SHOT_POWER,
        ))
      }

      // ── Clone spawns ─────────────────────────────────────────────────────────
      if (effects.has('clone') && state.cloneData) {
        for (let c = 0; c < state.cloneData.positions.length; c++) {
          const [cx, cz] = state.cloneData.positions[c]
          const cAngle = state.aimAngle + state.cloneData.angles[c]
          const cdx = Math.cos(cAngle)
          const cdz = Math.sin(cAngle)
          const cpx = -cdz
          const cpz =  cdx

          let cloneSpawns: Array<{ ox: number; oz: number; da: number }> = [{ ox: 0, oz: 0, da: 0 }]

          if (effects.has('tripleShot')) {
            cloneSpawns = cloneSpawns.flatMap(s => [
              s,
              { ...s, ox: s.ox - cdx * SPAWN_GAP,     oz: s.oz - cdz * SPAWN_GAP     },
              { ...s, ox: s.ox - cdx * SPAWN_GAP * 2,  oz: s.oz - cdz * SPAWN_GAP * 2 },
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
              scene, cx + ox, CUE_Y, cz + oz,
              Math.cos(angle) * SHOT_POWER, Math.sin(angle) * SHOT_POWER,
            ))
          }
        }
        state.cloneData = null
      }

      hideGhosts()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'Enter', ' '].includes(e.key)) e.preventDefault()
      keys.add(e.key)
      if (e.key === 'Enter' || e.key === ' ') fireShot()
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key)

    const onMouseMove = (e: MouseEvent) => {
      if (state.phase !== 'aiming') return
      const cb = ballStates[0]
      if (!cb.active) return
      const rect = mount.getBoundingClientRect()
      const ndcX =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      const ndcY = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
      if (raycaster.ray.intersectPlane(tablePlane, intersection)) {
        const dx = intersection.x - cb.mesh.position.x
        const dz = intersection.z - cb.mesh.position.z
        if (Math.hypot(dx, dz) > 0.01) state.aimAngle = Math.atan2(dz, dx)
      }
    }

    let mouseDownX = 0, mouseDownY = 0
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      mouseDownX = e.clientX
      mouseDownY = e.clientY
    }
    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return
      if (Math.hypot(e.clientX - mouseDownX, e.clientY - mouseDownY) < 6) fireShot()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    mount.addEventListener('mousemove', onMouseMove)
    mount.addEventListener('mousedown', onMouseDown)
    mount.addEventListener('mouseup', onMouseUp)

    const clock = new THREE.Clock()

    const animate = () => {
      requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      const cb = ballStates[0]

      if (state.phase === 'aiming') {
        if (keys.has('ArrowLeft') || keys.has('a')) state.aimAngle -= AIM_SPEED * dt
        if (keys.has('ArrowRight') || keys.has('d')) state.aimAngle += AIM_SPEED * dt

        if (cb.active) {
          const curveEffect = activeEffectsRef.current.has('curveLeft') ? 'curveLeft'
            : activeEffectsRef.current.has('curveRight') ? 'curveRight'
            : null
          cue.visible = true
          positionCue(cue, cb.mesh.position, state.aimAngle, 0)
          if (curveEffect) {
            aimLine.visible = false
            curveAimLine.visible = true
            const sign = curveEffect === 'curveLeft' ? 1 : -1
            const pts = buildCurveAimPositions(
              cb.mesh.position.x, cb.mesh.position.z, CUE_Y + 0.002,
              state.aimAngle, sign,
            )
            const pos = curveAimGeo.attributes.position as THREE.BufferAttribute
            pos.array.set(pts)
            pos.needsUpdate = true
          } else {
            aimLine.visible = true
            curveAimLine.visible = false
            updateAimLine(
              aimLine,
              new THREE.Vector3(cb.mesh.position.x, CUE_Y + 0.002, cb.mesh.position.z),
              state.aimAngle,
            )
          }
        } else {
          cue.visible = false
          aimLine.visible = false
          curveAimLine.visible = false
        }

        // ── Clone ghost visualization ─────────────────────────────────────────
        const cloneActive = cb.active && activeEffectsRef.current.has('clone')

        if (cloneActive && state.cloneData === null) {
          state.cloneData = buildCloneData(ballStates)
        }

        for (let i = 0; i < CLONE_COUNT; i++) {
          const show = cloneActive && state.cloneData !== null && i < state.cloneData.positions.length
          ghostBalls[i].visible = show
          ghostCues[i].visible  = show
          ghostAimLines[i].visible = show
          if (show && state.cloneData) {
            const [gx, gz] = state.cloneData.positions[i]
            const angle = state.aimAngle + state.cloneData.angles[i]
            const ballPos = new THREE.Vector3(gx, CUE_Y, gz)
            ghostBalls[i].position.set(gx, CUE_Y, gz)
            positionCue(ghostCues[i], ballPos, angle, 0)
            updateAimLine(ghostAimLines[i], new THREE.Vector3(gx, CUE_Y + 0.002, gz), angle)
          }
        }

        // ── Pocket lock overlay visibility ────────────────────────────────────
        const effects = activeEffectsRef.current
        lockOverlays.forEach((disc, i) => {
          disc.visible = (i < 4 && effects.has('lockCornerPockets')) || (i >= 4 && effects.has('lockMiddlePockets'))
        })

      } else if (state.phase === 'rolling') {
        hideGhosts()

        const effects = activeEffectsRef.current
        const physicsOpts = buildStepPhysicsOpts(effects)

        if (effects.has('curveLeft') || effects.has('curveRight')) {
          const sign = effects.has('curveLeft') ? 1 : -1
          const cueBalls = [ballStates[0], ...state.extraCueBalls].filter(b => b.active)
          for (const cb of cueBalls) {
            const ovx = cb.vx
            cb.vx += (-cb.vz) * sign * CURVE_FORCE * dt
            cb.vz += ( ovx)   * sign * CURVE_FORCE * dt
          }
        }

        stepPhysics([...ballStates, ...state.extraCueBalls], dt, physicsOpts)

        if (effects.has('magneticCue')) {
          const cueBalls = [ballStates[0], ...state.extraCueBalls].filter(b => b.active)
          for (const colored of ballStates.slice(1)) {
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
          for (const ball of ballStates.slice(1)) {
            if (!ball.active) continue
            const angle = Math.random() * Math.PI * 2
            ball.vx += Math.cos(angle) * SEISME_IMPULSE_PER_SEC * dt
            ball.vz += Math.sin(angle) * SEISME_IMPULSE_PER_SEC * dt
          }
          state.seismeRemaining = Math.max(0, state.seismeRemaining - dt)
        }

        // ── Explosive shot: each cue ball triggers one explosion on first contact
        if (activeEffectsRef.current.has('explosiveShot')) {
          const cueBalls = [ballStates[0], ...state.extraCueBalls].filter(b => b.active)
          const CONTACT_THRESHOLD = BALL_RADIUS * 2 * 1.15
          for (const cb of cueBalls) {
            if (state.explosionFiredBy.has(cb.mesh)) continue
            for (const target of ballStates.slice(1)) {
              if (!target.active) continue
              const dist = Math.hypot(
                target.mesh.position.x - cb.mesh.position.x,
                target.mesh.position.z - cb.mesh.position.z,
              )
              if (dist < CONTACT_THRESHOLD) {
                const ecx = cb.mesh.position.x
                const ecz = cb.mesh.position.z
                applyExplosion([...ballStates, ...state.extraCueBalls], ecx, ecz)
                state.explosionFiredBy.add(cb.mesh)
                const usedRings = new Set(state.explosionVisuals.map(v => v.ringIndex))
                const ringIdx = explosionRings.findIndex((_, i) => !usedRings.has(i))
                if (ringIdx >= 0) {
                  explosionRings[ringIdx].position.set(ecx, TABLE_HEIGHT / 2 + 0.004, ecz)
                  state.explosionVisuals.push({ progress: 0, ringIndex: ringIdx })
                }
                break
              }
            }
          }
        }

        // ── Clone on contact: clone each colored ball touched by a cue ball ────
        if (activeEffectsRef.current.has('cloneOnContact')) {
          const cueBalls = [ballStates[0], ...state.extraCueBalls].filter(b => b.active)
          const CONTACT_DIST = BALL_RADIUS * 2 * 1.15
          const coloredSnapshot = ballStates.slice(1)
          for (const cueBall of cueBalls) {
            for (const target of coloredSnapshot) {
              if (!target.active || state.clonedBallsThisShot.has(target.mesh)) continue
              const dist = Math.hypot(
                target.mesh.position.x - cueBall.mesh.position.x,
                target.mesh.position.z - cueBall.mesh.position.z,
              )
              if (dist < CONTACT_DIST) {
                const pos = tryPlaceClone(ballStates, [])
                if (pos) {
                  const cloneMesh = new THREE.Mesh(
                    target.mesh.geometry,
                    (target.mesh.material as THREE.MeshStandardMaterial).clone(),
                  )
                  cloneMesh.position.set(pos[0], CUE_Y, pos[1])
                  cloneMesh.castShadow = true
                  scene.add(cloneMesh)
                  ballStates.push({ mesh: cloneMesh, vx: 0, vz: 0, active: true })
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
          positionCue(cue, state.shotOrigin, state.aimAngle, state.shotAnim * 0.25)
          cue.visible = state.shotAnim < 1
          if (state.shotAnim >= 1) state.shotAnim = -1
        } else {
          cue.visible = false
        }
        aimLine.visible = false
        curveAimLine.visible = false

        const allBalls = [...ballStates, ...state.extraCueBalls]
        const allStopped = allBalls.filter(b => b.active).every(b => Math.hypot(b.vx, b.vz) < MIN_SPEED)

        if (allStopped) {
          allBalls.forEach(b => { b.vx = 0; b.vz = 0 })
          const coloredNow = ballStates.slice(1).filter(b => b.active).length
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

          cleanupExtraCueBalls()
          state.clonedBallsThisShot.clear()

          const isVictory = coloredNow === 0
          callbackRef.current(ballsPotted, scratch, isVictory)

          if (isVictory) {
            state.phase = 'victory'
            cue.visible = false
            aimLine.visible = false
            curveAimLine.visible = false
            controls.autoRotate = true
            controls.autoRotateSpeed = 10
            onRollingChangeRef.current?.(false)
          } else {
            if (scratch) {
              cb.active = true
              cb.mesh.visible = true
              cb.mesh.position.set(-TABLE_WIDTH / 4, CUE_Y, 0)
              cb.vx = 0
              cb.vz = 0
            }
            state.phase = 'aiming'
            onRollingChangeRef.current?.(false)
          }
        }
      }
      // 'victory': camera autoRotates only

      // ── Explosion ring animations (one per active explosion) ─────────────────
      for (let i = state.explosionVisuals.length - 1; i >= 0; i--) {
        const v = state.explosionVisuals[i]
        const ring = explosionRings[v.ringIndex]
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

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nw = mount.clientWidth, nh = mount.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      mount.removeEventListener('mousemove', onMouseMove)
      mount.removeEventListener('mousedown', onMouseDown)
      mount.removeEventListener('mouseup', onMouseUp)
      cleanupExtraCueBalls()
      for (const m of [...ghostBalls, ...ghostCues, ...ghostAimLines]) scene.remove(m)
      for (const m of lockOverlays) scene.remove(m)
      for (const ring of explosionRings) { scene.remove(ring); ring.material.dispose() }
      ringGeo.dispose()
      ghostBallMat.dispose()
      ghostCueMat.dispose()
      ghostAimMat.dispose()
      cornerLockMat.dispose()
      middleLockMat.dispose()
      curveAimGeo.dispose()
      curveAimMat.dispose()
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />
}
