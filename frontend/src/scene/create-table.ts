import * as THREE from 'three'
import {
  TABLE_WIDTH, TABLE_LENGTH, TABLE_HEIGHT,
  FELT_COLOR, WOOD_COLOR, POCKET_RADIUS,
} from '../config/constants'

export function createTable(scene: THREE.Scene) {
  const feltMat = new THREE.MeshStandardMaterial({ color: FELT_COLOR, roughness: 0.9, metalness: 0 })
  const felt = new THREE.Mesh(new THREE.BoxGeometry(TABLE_WIDTH, TABLE_HEIGHT, TABLE_LENGTH), feltMat)
  felt.receiveShadow = true
  scene.add(felt)

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
