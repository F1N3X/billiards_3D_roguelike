import * as THREE from 'three'
import { BALL_RADIUS, TABLE_WIDTH, TABLE_HEIGHT, BALL_COLORS } from '../config/constants'
import type { BallState } from '../types/billiards'

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

export function createBalls(scene: THREE.Scene): BallState[] {
  const states: BallState[] = []
  const geo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32)

  const startX = TABLE_WIDTH / 4
  const spacing = BALL_RADIUS * 2.05
  const positions: [number, number][] = []
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
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(pos[0], TABLE_HEIGHT / 2 + BALL_RADIUS, pos[1])
    mesh.castShadow = true
    scene.add(mesh)
    states.push({ mesh, vx: 0, vz: 0, active: true })
  })

  const cueMesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.15, metalness: 0.05 }),
  )
  cueMesh.position.set(-TABLE_WIDTH / 4, TABLE_HEIGHT / 2 + BALL_RADIUS, 0)
  cueMesh.castShadow = true
  scene.add(cueMesh)
  states.unshift({ mesh: cueMesh, vx: 0, vz: 0, active: true })

  return states
}
