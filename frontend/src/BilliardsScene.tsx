import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  TABLE_WIDTH, TABLE_HEIGHT, TABLE_LENGTH, BALL_RADIUS,
  CUE_COLOR, CUE_LENGTH,
  SHOT_POWER, AIM_SPEED, INITIAL_AIM_ANGLE,
  POCKET_XZ, POCKET_RADIUS,
  CLONE_COUNT,
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

    const aimGeo = new THREE.BufferGeometry()
    aimGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    const aimLine = new THREE.Line(
      aimGeo,
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true }),
    )
    scene.add(aimLine)

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

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'Enter', ' '].includes(e.key)) e.preventDefault()
      keys.add(e.key)

      if ((e.key === 'Enter' || e.key === ' ') && state.phase === 'aiming') {
        const cb = ballStates[0]
        if (!cb.active) return

        state.activeBeforeShot = ballStates.slice(1).filter(b => b.active).length
        state.shotOrigin.copy(cb.mesh.position)

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

        // Fire original ball
        cb.vx = dx * SHOT_POWER
        cb.vz = dz * SHOT_POWER
        state.phase = 'rolling'
        state.shotAnim = 0
        onRollingChangeRef.current?.(true)

        // Extra balls from main spawns
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

        // ── Clone spawns: each at its random position/angle ──────────────────
        // tripleShot / tripleTriangle also apply to each clone's own direction
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
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const clock = new THREE.Clock()

    const animate = () => {
      requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      const cb = ballStates[0]

      if (state.phase === 'aiming') {
        if (keys.has('ArrowLeft') || keys.has('a')) state.aimAngle -= AIM_SPEED * dt
        if (keys.has('ArrowRight') || keys.has('d')) state.aimAngle += AIM_SPEED * dt

        if (cb.active) {
          cue.visible = true
          aimLine.visible = true
          positionCue(cue, cb.mesh.position, state.aimAngle, 0)
          updateAimLine(
            aimLine,
            new THREE.Vector3(cb.mesh.position.x, CUE_Y + 0.002, cb.mesh.position.z),
            state.aimAngle,
          )
        } else {
          cue.visible = false
          aimLine.visible = false
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

      } else if (state.phase === 'rolling') {
        hideGhosts()

        stepPhysics([...ballStates, ...state.extraCueBalls], dt)

        if (state.shotAnim >= 0) {
          state.shotAnim = Math.min(state.shotAnim + dt / 0.12, 1)
          positionCue(cue, state.shotOrigin, state.aimAngle, state.shotAnim * 0.25)
          cue.visible = state.shotAnim < 1
          if (state.shotAnim >= 1) state.shotAnim = -1
        } else {
          cue.visible = false
        }
        aimLine.visible = false

        const allBalls = [...ballStates, ...state.extraCueBalls]
        const allStopped = allBalls.filter(b => b.active).every(b => b.vx === 0 && b.vz === 0)

        if (allStopped) {
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

          const isVictory = coloredNow === 0
          callbackRef.current(ballsPotted, scratch, isVictory)

          if (isVictory) {
            state.phase = 'victory'
            cue.visible = false
            aimLine.visible = false
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
      cleanupExtraCueBalls()
      for (const m of [...ghostBalls, ...ghostCues, ...ghostAimLines]) scene.remove(m)
      ghostBallMat.dispose()
      ghostCueMat.dispose()
      ghostAimMat.dispose()
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />
}
