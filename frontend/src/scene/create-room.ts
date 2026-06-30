import * as THREE from 'three'
import { ROOM_W, ROOM_D, ROOM_H, FLOOR_Y } from '../config/constants'

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

  const splitY = Math.round(S * 0.62)
  ctx.fillStyle = '#1c3a22'
  ctx.fillRect(0, 0, S, splitY)

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

  ctx.fillStyle = '#7a4020'
  ctx.fillRect(0, splitY - 10, S, 20)
  ctx.fillStyle = '#9a5830'
  ctx.fillRect(0, splitY - 10, S, 4)
  ctx.fillStyle = '#5a2c10'
  ctx.fillRect(0, splitY + 6, S, 4)

  const wainsY = splitY + 10
  ctx.fillStyle = '#2e1208'
  ctx.fillRect(0, wainsY, S, S - wainsY)

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

export function createRoom(scene: THREE.Scene) {
  const floorTex = makeFloorTexture()
  const wallTex = makeWallTexture()

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W, ROOM_D),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.75, metalness: 0.02 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = FLOOR_Y
  floor.receiveShadow = true
  scene.add(floor)

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W, ROOM_D),
    new THREE.MeshStandardMaterial({ color: 0x110c08, roughness: 1, metalness: 0 }),
  )
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = FLOOR_Y + ROOM_H
  scene.add(ceiling)

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

  addWall(ROOM_W, ROOM_H,  0,            -ROOM_D / 2,  0)
  addWall(ROOM_W, ROOM_H,  0,             ROOM_D / 2,  Math.PI)
  addWall(ROOM_D, ROOM_H, -ROOM_W / 2,   0,           -Math.PI / 2)
  addWall(ROOM_D, ROOM_H,  ROOM_W / 2,   0,            Math.PI / 2)
}
