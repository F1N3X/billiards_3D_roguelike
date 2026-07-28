import * as THREE from 'three'
import { TABLE_HEIGHT } from '../config/constants'

export function createPendantLamps(scene: THREE.Scene) {
  const lampPositions = [-1.4, 0, 1.4]
  const lampHeight = 2.2

  lampPositions.forEach(x => {

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
