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
const POCKET_RADIUS = 0.19

const ROOM_W = 16
const ROOM_D = 12
const ROOM_H = 5.5
const FLOOR_Y = -0.86

const BALL_COLORS = [
  0xf5f5f5, // cue ball
  0xf5e400, // 1 - yellow
  0x1a1acc, // 2 - blue
  0xdd1111, // 3 - red
  0x7700cc, // 4 - purple
  0xff6600, // 5 - orange
  0x006600, // 6 - green
  0x800000, // 7 - maroon
  0x111111, // 8 - black
  0xf5e400, // 9 - yellow stripe
  0x1a1acc, // 10 - blue stripe
  0xdd1111, // 11 - red stripe
  0x7700cc, // 12 - purple stripe
  0xff6600, // 13 - orange stripe
  0x006600, // 14 - green stripe
  0x800000, // 15 - maroon stripe
]

// ─── Ball textures ────────────────────────────────────────────────────────────

function createBallTexture(number: number, color: number): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const isStriped = number >= 9
  const r = (color >> 16) & 0xff
  const g = (color >> 8) & 0xff
  const b = color & 0xff
  const hexColor = `rgb(${r},${g},${b})`

  if (isStriped) {
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = hexColor
    ctx.fillRect(0, Math.round(size * 0.28), size, Math.round(size * 0.44))
  } else {
    ctx.fillStyle = hexColor
    ctx.fillRect(0, 0, size, size)
  }

  const circleR = size * 0.16
  const fontSize = Math.round(size * 0.18)
  ;[size * 0.25, size * 0.75].forEach(cx => {
    const cy = size / 2
    ctx.beginPath()
    ctx.arc(cx, cy, circleR, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.fillStyle = '#111111'
    ctx.font = `bold ${fontSize}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(number), cx, cy + 2)
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// ─── Room textures ────────────────────────────────────────────────────────────

function makeFloorTexture(): THREE.CanvasTexture {
  const S = 512
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!

  const colors = ['#3d1f0e', '#421d0c', '#38190a', '#4a2210', '#351a0a', '#3f1e0d']
  const nPlanks = 6
  const pw = S / nPlanks

  for (let i = 0; i < nPlanks; i++) {
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(i * pw + 1, 0, pw - 2, S)

    // Wood grain lines
    ctx.strokeStyle = 'rgba(0,0,0,0.10)'
    ctx.lineWidth = 1
    for (let g = 1; g <= 4; g++) {
      const ty = (g / 5) * S
      ctx.beginPath()
      ctx.moveTo(i * pw + 1, ty - 3)
      ctx.quadraticCurveTo(i * pw + pw * 0.5, ty + 5, i * pw + pw - 1, ty - 2)
      ctx.stroke()
    }
  }

  // Subtle varnish sheen
  const grad = ctx.createLinearGradient(0, 0, 0, S)
  grad.addColorStop(0, 'rgba(200,120,40,0.07)')
  grad.addColorStop(1, 'rgba(0,0,0,0.09)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, S, S)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 5)
  return tex
}

function makeWallTexture(): THREE.CanvasTexture {
  const S = 512
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!

  // ── Wallpaper zone (top 62%) ──
  const splitY = Math.round(S * 0.62)
  ctx.fillStyle = '#1c3a22'
  ctx.fillRect(0, 0, S, splitY)

  // Diamond damask pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.055)'
  ctx.lineWidth = 1
  const dW = 60, dH = 44
  for (let row = -1; row * dH < splitY + dH; row++) {
    for (let col = -1; col * dW < S + dW; col++) {
      const ox = (row % 2 !== 0) ? dW / 2 : 0
      const cx = col * dW + ox
      const cy = row * dH
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + dW / 2, cy + dH / 2)
      ctx.lineTo(cx, cy + dH)
      ctx.lineTo(cx - dW / 2, cy + dH / 2)
      ctx.closePath()
      ctx.stroke()
    }
  }

  // ── Chair rail ──
  ctx.fillStyle = '#7a4020'
  ctx.fillRect(0, splitY - 10, S, 20)
  ctx.fillStyle = '#9a5830'
  ctx.fillRect(0, splitY - 10, S, 4)
  ctx.fillStyle = '#5a2c10'
  ctx.fillRect(0, splitY + 6, S, 4)

  // ── Wainscoting (lower 38%) ──
  const wainsY = splitY + 10
  ctx.fillStyle = '#2e1208'
  ctx.fillRect(0, wainsY, S, S - wainsY)

  // Panel grooves
  const nPanels = 3
  const panelW = S / nPanels
  for (let p = 0; p < nPanels; p++) {
    const px = p * panelW
    const m = 10
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 3
    ctx.strokeRect(px + m, wainsY + m, panelW - m * 2, S - wainsY - m * 2)
    ctx.strokeStyle = 'rgba(110,55,20,0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(px + m + 5, wainsY + m + 5, panelW - m * 2 - 10, S - wainsY - m * 2 - 10)
  }

  // ── Baseboard ──
  ctx.fillStyle = '#4a2210'
  ctx.fillRect(0, S - 18, S, 18)
  ctx.fillStyle = '#7a3a18'
  ctx.fillRect(0, S - 18, S, 3)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

// ─── Room construction ────────────────────────────────────────────────────────

function createRoom(scene: THREE.Scene) {
  const floorTex = makeFloorTexture()
  const wallTex = makeWallTexture()

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W, ROOM_D),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.75, metalness: 0.02 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = FLOOR_Y
  floor.receiveShadow = true
  scene.add(floor)

  // Ceiling — dark, no texture
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W, ROOM_D),
    new THREE.MeshStandardMaterial({ color: 0x110c08, roughness: 1, metalness: 0 }),
  )
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = FLOOR_Y + ROOM_H
  scene.add(ceiling)

  // Helper: a wall plane facing inward
  const addWall = (w: number, h: number, x: number, z: number, rotY: number) => {
    const t = wallTex.clone()
    t.needsUpdate = true
    t.repeat.set(Math.ceil(w / 2.4), 1)
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, metalness: 0 }),
    )
    mesh.position.set(x, FLOOR_Y + ROOM_H / 2, z)
    mesh.rotation.y = rotY
    mesh.receiveShadow = true
    scene.add(mesh)
  }

  // rotY values chosen so the plane's +Z normal faces room center
  addWall(ROOM_W, ROOM_H,  0,            -ROOM_D / 2,  0)            // back  (+z facing)
  addWall(ROOM_W, ROOM_H,  0,             ROOM_D / 2,  Math.PI)      // front (-z facing)
  addWall(ROOM_D, ROOM_H, -ROOM_W / 2,   0,           -Math.PI / 2)  // left  (+x facing)
  addWall(ROOM_D, ROOM_H,  ROOM_W / 2,   0,            Math.PI / 2)  // right (-x facing)
}

// ─── Table ────────────────────────────────────────────────────────────────────

function createTable(scene: THREE.Scene) {
  const feltMat = new THREE.MeshStandardMaterial({ color: FELT_COLOR, roughness: 0.9, metalness: 0 })
  const felt = new THREE.Mesh(new THREE.BoxGeometry(TABLE_WIDTH, TABLE_HEIGHT, TABLE_LENGTH), feltMat)
  felt.receiveShadow = true
  scene.add(felt)

  // Pocket holes — 4 corners + 2 side pockets
  const pocketMat = new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 1, metalness: 0 })
  const inset = POCKET_RADIUS * 0.55
  const pocketPositions: [number, number][] = [
    [-(TABLE_WIDTH / 2 - inset), -(TABLE_LENGTH / 2 - inset)],
    [ TABLE_WIDTH / 2 - inset,  -(TABLE_LENGTH / 2 - inset)],
    [-(TABLE_WIDTH / 2 - inset),  TABLE_LENGTH / 2 - inset],
    [ TABLE_WIDTH / 2 - inset,   TABLE_LENGTH / 2 - inset],
    [0, -(TABLE_LENGTH / 2 - inset)],
    [0,  TABLE_LENGTH / 2 - inset],
  ]

  pocketPositions.forEach(([x, z]) => {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(POCKET_RADIUS, POCKET_RADIUS, 0.015, 32),
      pocketMat,
    )
    disc.position.set(x, TABLE_HEIGHT / 2 + 0.002, z)
    scene.add(disc)

    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(POCKET_RADIUS, POCKET_RADIUS * 0.6, 0.14, 32, 1, true),
      pocketMat,
    )
    cup.position.set(x, TABLE_HEIGHT / 2 - 0.06, z)
    scene.add(cup)

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(POCKET_RADIUS, 0.025, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.8, metalness: 0 }),
    )
    rim.rotation.x = Math.PI / 2
    rim.position.set(x, TABLE_HEIGHT / 2 + 0.002, z)
    scene.add(rim)
  })

  const borderMat = new THREE.MeshStandardMaterial({ color: WOOD_COLOR, roughness: 0.6, metalness: 0.1 })
  const borders = [
    { w: TABLE_WIDTH + 0.2, h: 0.15, d: 0.15, x: 0, z: -(TABLE_LENGTH / 2 + 0.075) },
    { w: TABLE_WIDTH + 0.2, h: 0.15, d: 0.15, x: 0, z:  TABLE_LENGTH / 2 + 0.075 },
    { w: 0.15, h: 0.15, d: TABLE_LENGTH, x: -(TABLE_WIDTH / 2 + 0.075), z: 0 },
    { w: 0.15, h: 0.15, d: TABLE_LENGTH, x:  TABLE_WIDTH / 2 + 0.075,  z: 0 },
  ]
  borders.forEach(({ w, h, d, x, z }) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), borderMat)
    mesh.position.set(x, TABLE_HEIGHT / 2 + h / 2 - 0.01, z)
    mesh.castShadow = true
    scene.add(mesh)
  })

  const legMat = new THREE.MeshStandardMaterial({ color: WOOD_COLOR, roughness: 0.6, metalness: 0.1 })
  const legPositions: [number, number][] = [
    [-TABLE_WIDTH / 2 + 0.1, -TABLE_LENGTH / 2 + 0.1],
    [ TABLE_WIDTH / 2 - 0.1, -TABLE_LENGTH / 2 + 0.1],
    [-TABLE_WIDTH / 2 + 0.1,  TABLE_LENGTH / 2 - 0.1],
    [ TABLE_WIDTH / 2 - 0.1,  TABLE_LENGTH / 2 - 0.1],
  ]
  legPositions.forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8), legMat)
    leg.position.set(x, -TABLE_HEIGHT / 2 - 0.4, z)
    leg.castShadow = true
    scene.add(leg)
  })
}

// ─── Balls ────────────────────────────────────────────────────────────────────

function createBalls(scene: THREE.Scene): THREE.Mesh[] {
  const balls: THREE.Mesh[] = []
  const geo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32)

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
    const mat = new THREE.MeshStandardMaterial({
      map: createBallTexture(i + 1, BALL_COLORS[i + 1]),
      roughness: 0.2,
      metalness: 0.05,
    })
    const ball = new THREE.Mesh(geo, mat)
    ball.position.set(pos[0], TABLE_HEIGHT / 2 + BALL_RADIUS, pos[1])
    ball.castShadow = true
    scene.add(ball)
    balls.push(ball)
  })

  // Cue ball — plain white
  const cueBall = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.15, metalness: 0.05 }),
  )
  cueBall.position.set(-1.2, TABLE_HEIGHT / 2 + BALL_RADIUS, 0)
  cueBall.castShadow = true
  scene.add(cueBall)
  balls.unshift(cueBall)

  return balls
}

// ─── Cue ─────────────────────────────────────────────────────────────────────

function createCue(scene: THREE.Scene): THREE.Mesh {
  const cue = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.03, 2.5, 16),
    new THREE.MeshStandardMaterial({ color: CUE_COLOR, roughness: 0.4, metalness: 0.1 }),
  )
  cue.castShadow = true
  scene.add(cue)
  return cue
}

// ─── Pendant lamps ────────────────────────────────────────────────────────────

function createPendantLamps(scene: THREE.Scene) {
  const lampPositions = [-1.4, 0, 1.4]
  const lampHeight = 2.2
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide })
  const bulbMat  = new THREE.MeshStandardMaterial({ color: 0xffeeaa, emissive: 0xffdd88, emissiveIntensity: 2, roughness: 1 })
  const cordMat  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 })

  lampPositions.forEach(x => {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, lampHeight - 0.2), cordMat)
    cord.position.set(x, TABLE_HEIGHT / 2 + lampHeight - 0.1, 0)
    scene.add(cord)

    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.14, 0.22, 20, 1, true), shadeMat)
    shade.position.set(x, TABLE_HEIGHT / 2 + lampHeight - 0.32, 0)
    scene.add(shade)

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), bulbMat)
    bulb.position.set(x, TABLE_HEIGHT / 2 + lampHeight - 0.32, 0)
    scene.add(bulb)

    const spot = new THREE.SpotLight(0xfff5cc, 3.5)
    spot.position.set(x, TABLE_HEIGHT / 2 + lampHeight - 0.32, 0)
    spot.target.position.set(x, 0, 0)
    spot.angle    = Math.PI / 5.5
    spot.penumbra = 0.35
    spot.decay    = 1.8
    spot.castShadow = true
    spot.shadow.mapSize.width  = 1024
    spot.shadow.mapSize.height = 1024
    spot.shadow.camera.near = 0.5
    spot.shadow.camera.far  = 8
    scene.add(spot)
    scene.add(spot.target)
  })
}

// ─── Main component ───────────────────────────────────────────────────────────

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

    // Lights — global fill
    scene.add(new THREE.AmbientLight(0xfff0d8, 0.9))
    scene.add(new THREE.HemisphereLight(0xffe0a0, 0x3a1e08, 0.7))

    // Corner fill points to light walls & floor
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

    // Build scene
    createRoom(scene)
    createTable(scene)
    const balls = createBalls(scene)
    const cue   = createCue(scene)
    createPendantLamps(scene)

    let angle = 0
    const animate = () => {
      requestAnimationFrame(animate)
      angle += 0.005

      const cueBall = balls[0]
      cue.position.set(
        cueBall.position.x + Math.cos(angle) * 1.4,
        TABLE_HEIGHT / 2 + BALL_RADIUS,
        cueBall.position.z + Math.sin(angle) * 1.4,
      )
      cue.rotation.z = Math.PI / 2
      cue.rotation.y = -angle

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
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />
}
