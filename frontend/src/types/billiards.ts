import * as THREE from 'three'

export interface BallState {
  mesh: THREE.Mesh
  vx: number
  vz: number
  active: boolean
}
