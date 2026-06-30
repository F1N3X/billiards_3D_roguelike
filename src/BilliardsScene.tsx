import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  TABLE_WIDTH, TABLE_HEIGHT, BALL_RADIUS,
  SHOT_POWER, AIM_SPEED, INITIAL_AIM_ANGLE,
} from './config/constants'
import { createRoom } from './scene/create-room'
import { createTable } from './scene/create-table'
import { createBalls } from './scene/create-balls'
import { createCue } from './scene/create-cue'
import { createPendantLamps } from './scene/create-lamps'
import { stepPhysics, positionCue, updateAimLine } from './physics/step-physics'

export default function BilliardsScene() {
  const mountRef = useRef<HTMLDivElement>(null)

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
    const fills: [number, number, number][] = [
      [-6, 2, -4], [6, 2, -4], [-6, 2, 4], [6, 2, 4],
    ]
    fills.forEach(([x, y, z]) => {
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

    const state = {
      phase: 'aiming' as 'aiming' | 'rolling',
      aimAngle: INITIAL_AIM_ANGLE,
      shotAnim: -1,
      shotOrigin: new THREE.Vector3(),
    }

    const keys = new Set<string>()

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'Enter', ' '].includes(e.key)) e.preventDefault()
      keys.add(e.key)

      if ((e.key === 'Enter' || e.key === ' ') && state.phase === 'aiming') {
        const cb = ballStates[0]
        if (!cb.active) return
        state.shotOrigin.copy(cb.mesh.position)
        cb.vx = Math.cos(state.aimAngle) * SHOT_POWER
        cb.vz = Math.sin(state.aimAngle) * SHOT_POWER
        state.phase = 'rolling'
        state.shotAnim = 0
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
            new THREE.Vector3(cb.mesh.position.x, TABLE_HEIGHT / 2 + 0.002, cb.mesh.position.z),
            state.aimAngle,
          )
        } else {
          cue.visible = false
          aimLine.visible = false
        }

      } else {
        stepPhysics(ballStates, dt)

        if (state.shotAnim >= 0) {
          state.shotAnim = Math.min(state.shotAnim + dt / 0.12, 1)
          positionCue(cue, state.shotOrigin, state.aimAngle, state.shotAnim * 0.25)
          cue.visible = state.shotAnim < 1
          if (state.shotAnim >= 1) state.shotAnim = -1
        } else {
          cue.visible = false
        }
        aimLine.visible = false

        const allStopped = ballStates.filter(b => b.active).every(b => b.vx === 0 && b.vz === 0)
        if (allStopped) {
          if (!cb.active) {
            cb.active = true
            cb.mesh.visible = true
            cb.mesh.position.set(-TABLE_WIDTH / 4, TABLE_HEIGHT / 2 + BALL_RADIUS, 0)
            cb.vx = 0
            cb.vz = 0
          }
          state.phase = 'aiming'
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
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />
}
