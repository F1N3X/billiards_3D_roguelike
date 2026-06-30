import * as THREE from 'three'
import { TABLE_HEIGHT } from '../config/constants'

export function createPendantLamps(scene: THREE.Scene) {
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
