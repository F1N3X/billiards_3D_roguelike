import * as THREE from 'three'
import { CUE_LENGTH, CUE_COLOR } from '../config/constants'

export function createCue(scene: THREE.Scene): THREE.Mesh {
  const cue = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.03, CUE_LENGTH, 16),
    new THREE.MeshStandardMaterial({ color: CUE_COLOR, roughness: 0.4, metalness: 0.1 }),
  )
  cue.castShadow = true
  scene.add(cue)
  return cue
}
