import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const BALL_RADIUS = 0.15
const TABLE_WIDTH = 4.5
const TABLE_LENGTH = 2.5
const TABLE_HEIGHT = 0.1
const FELT_COLOR = 0x2d7a2d
const WOOD_COLOR = 0x8B4513
const CUE_COLOR = 0xd4a017

const BALL_COLORS = [
  0xf5f5f5, // cue ball - white
  0xf5e400, // 1 - yellow
  0x0000cc, // 2 - blue
  0xcc0000, // 3 - red
  0x6600cc, // 4 - purple
  0xff6600, // 5 - orange
  0x006600, // 6 - dark green
  0xcc0000, // 7 - maroon
  0x1a1a1a, // 8 - black
  0xf5e400, // 9 - yellow stripe
  0x0000cc, // 10 - blue stripe
  0xcc0000, // 11 - red stripe
  0x6600cc, // 12 - purple stripe
  0xff6600, // 13 - orange stripe
  0x006600, // 14 - dark green stripe
  0xcc0000, // 15 - maroon stripe
]

function createTable(scene: THREE.Scene) {
  // Felt surface
  const feltGeo = new THREE.BoxGeometry(TABLE_WIDTH, TABLE_HEIGHT, TABLE_LENGTH)
  const feltMat = new THREE.MeshLambertMaterial({ color: FELT_COLOR })
  const felt = new THREE.Mesh(feltGeo, feltMat)
  felt.receiveShadow = true
  scene.add(felt)

  // Wood border
  const borderMat = new THREE.MeshLambertMaterial({ color: WOOD_COLOR })
  const borders = [
    { w: TABLE_WIDTH + 0.2, h: 0.15, d: 0.15, x: 0, z: -(TABLE_LENGTH / 2 + 0.075) },
    { w: TABLE_WIDTH + 0.2, h: 0.15, d: 0.15, x: 0, z: TABLE_LENGTH / 2 + 0.075 },
    { w: 0.15, h: 0.15, d: TABLE_LENGTH, x: -(TABLE_WIDTH / 2 + 0.075), z: 0 },
    { w: 0.15, h: 0.15, d: TABLE_LENGTH, x: TABLE_WIDTH / 2 + 0.075, z: 0 },
  ]
  borders.forEach(({ w, h, d, x, z }) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), borderMat)
    mesh.position.set(x, TABLE_HEIGHT / 2 + h / 2 - 0.01, z)
    mesh.castShadow = true
    scene.add(mesh)
  })

  // Legs
  const legMat = new THREE.MeshLambertMaterial({ color: WOOD_COLOR })
  const legPositions = [
    [-TABLE_WIDTH / 2 + 0.1, -TABLE_LENGTH / 2 + 0.1],
    [TABLE_WIDTH / 2 - 0.1, -TABLE_LENGTH / 2 + 0.1],
    [-TABLE_WIDTH / 2 + 0.1, TABLE_LENGTH / 2 - 0.1],
    [TABLE_WIDTH / 2 - 0.1, TABLE_LENGTH / 2 - 0.1],
  ]
  legPositions.forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8), legMat)
    leg.position.set(x, -TABLE_HEIGHT / 2 - 0.4, z)
    leg.castShadow = true
    scene.add(leg)
  })
}

function createBalls(scene: THREE.Scene): THREE.Mesh[] {
  const balls: THREE.Mesh[] = []
  const geo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32)

  // Triangle rack positions (15 balls)
  const startX = 1.0
  const positions: [number, number][] = []
  const spacing = BALL_RADIUS * 2.05
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      positions.push([
        startX + row * spacing * Math.cos(Math.PI / 6),
        (col - row / 2) * spacing,
      ])
    }
  }

  positions.forEach((pos, i) => {
    const mat = new THREE.MeshLambertMaterial({ color: BALL_COLORS[i + 1] })
    const ball = new THREE.Mesh(geo, mat)
    ball.position.set(pos[0], TABLE_HEIGHT / 2 + BALL_RADIUS, pos[1])
    ball.castShadow = true
    scene.add(ball)
    balls.push(ball)
  })

  // Cue ball
  const cueMat = new THREE.MeshLambertMaterial({ color: BALL_COLORS[0] })
  const cueBall = new THREE.Mesh(geo, cueMat)
  cueBall.position.set(-1.2, TABLE_HEIGHT / 2 + BALL_RADIUS, 0)
  cueBall.castShadow = true
  scene.add(cueBall)
  balls.unshift(cueBall)

  return balls
}

function createCue(scene: THREE.Scene): THREE.Mesh {
  const cueGeo = new THREE.CylinderGeometry(0.015, 0.03, 2.5, 16)
  const cueMat = new THREE.MeshLambertMaterial({ color: CUE_COLOR })
  const cue = new THREE.Mesh(cueGeo, cueMat)
  cue.castShadow = true
  scene.add(cue)
  return cue
}

export default function BilliardsScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current!
    const w = mount.clientWidth
    const h = mount.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)

    // Scene & camera
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
    camera.position.set(0, 4, 4)
    camera.lookAt(0, 0, 0)

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)

    const spot = new THREE.SpotLight(0xffffff, 2)
    spot.position.set(0, 5, 0)
    spot.castShadow = true
    spot.shadow.mapSize.width = 2048
    spot.shadow.mapSize.height = 2048
    spot.angle = Math.PI / 3
    spot.penumbra = 0.2
    scene.add(spot)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 2
    controls.maxDistance = 12
    controls.maxPolarAngle = Math.PI / 2.1

    // Build scene
    createTable(scene)
    const balls = createBalls(scene)
    const cue = createCue(scene)

    // Cue follows cue ball with animated swing
    let angle = 0

    const animate = () => {
      requestAnimationFrame(animate)
      angle += 0.005

      const cueBall = balls[0]
      const cx = cueBall.position.x
      const cz = cueBall.position.z
      const dist = 1.4

      cue.position.set(
        cx + Math.cos(angle) * dist,
        TABLE_HEIGHT / 2 + BALL_RADIUS,
        cz + Math.sin(angle) * dist,
      )
      cue.rotation.z = Math.PI / 2
      cue.rotation.y = -angle

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nw = mount.clientWidth
      const nh = mount.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />
}
