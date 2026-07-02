import * as THREE from 'three'
import { buildEngineObjects, createEngineState } from './billiards-scene-setup'
import { fireShot } from './billiards-shot-handler'
import { handleAiming, updateExplosionVisuals } from './billiards-aiming'
import { handleRolling } from './billiards-rolling'
import { cleanupExtraCueBalls } from './billiards-engine-utils'
import type { EngineObjects, EngineState, EngineCallbacks } from './billiards-engine-types'

export class BilliardsEngine {
  private objects: EngineObjects
  private state: EngineState
  private callbacks: EngineCallbacks
  private keys = new Set<string>()
  private raycaster = new THREE.Raycaster()
  private tablePlane: THREE.Plane
  private intersection = new THREE.Vector3()
  private frameId = 0
  private mouseDownX = 0
  private mouseDownY = 0
  private touchStartX = 0
  private touchStartY = 0
  private inputListeners: Array<[EventTarget, string, EventListener]> = []
  private resizeHandler: () => void

  constructor(mount: HTMLDivElement, callbacks: EngineCallbacks) {
    this.callbacks = callbacks
    this.objects = buildEngineObjects(mount)
    this.state = createEngineState(this.objects.ballStates)
    this.tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.objects.CUE_Y)
    this.setupInputHandlers(mount)
    this.resizeHandler = this.buildResizeHandler(mount)
    window.addEventListener('resize', this.resizeHandler)
    this.startAnimationLoop()
  }

  updateCallbacks(callbacks: EngineCallbacks): void {
    this.callbacks = { ...callbacks }
  }

  dispose(): void {
    cancelAnimationFrame(this.frameId)
    window.removeEventListener('resize', this.resizeHandler)
    for (const [target, type, handler] of this.inputListeners) {
      target.removeEventListener(type, handler)
    }
    const { objects, state } = this
    cleanupExtraCueBalls(objects, state)
    for (const m of objects.ghostBalls) objects.scene.remove(m)
    for (const m of objects.ghostCues) objects.scene.remove(m)
    for (const m of objects.ghostAimLines) objects.scene.remove(m)
    for (const m of objects.lockOverlays) objects.scene.remove(m)
    for (const ring of objects.explosionRings) {
      objects.scene.remove(ring)
      ;(ring.material as THREE.MeshBasicMaterial).dispose()
    }
    objects.ringGeo.dispose()
    objects.ghostBallMat.dispose()
    objects.ghostCueMat.dispose()
    objects.ghostAimMat.dispose()
    objects.cornerLockMat.dispose()
    objects.middleLockMat.dispose()
    objects.curveAimGeo.dispose()
    objects.curveAimMat.dispose()
    objects.controls.dispose()
    objects.renderer.dispose()
    objects.mount.removeChild(objects.renderer.domElement)
  }

  private reg(target: EventTarget, type: string, handler: (e: Event) => void): void {
    target.addEventListener(type, handler)
    this.inputListeners.push([target, type, handler])
  }

  private setupInputHandlers(mount: HTMLDivElement): void {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'Enter', ' '].includes(e.key)) e.preventDefault()
      this.keys.add(e.key)
      if (e.key === 'Enter' || e.key === ' ') fireShot(this.objects, this.state, this.callbacks)
    }
    const onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key)

    const onMouseMove = (e: MouseEvent) => {
      if (this.state.phase !== 'aiming') return
      const cb = this.objects.ballStates[0]
      if (!cb.active) return
      const rect = mount.getBoundingClientRect()
      const ndcX =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      const ndcY = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.objects.camera)
      if (this.raycaster.ray.intersectPlane(this.tablePlane, this.intersection)) {
        const dx = this.intersection.x - cb.mesh.position.x
        const dz = this.intersection.z - cb.mesh.position.z
        if (Math.hypot(dx, dz) > 0.01) this.state.aimAngle = Math.atan2(dz, dx)
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      this.mouseDownX = e.clientX
      this.mouseDownY = e.clientY
    }
    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return
      if (Math.hypot(e.clientX - this.mouseDownX, e.clientY - this.mouseDownY) < 6) {
        fireShot(this.objects, this.state, this.callbacks)
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      this.touchStartX = touch.clientX
      this.touchStartY = touch.clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      if (this.state.phase !== 'aiming') return
      const cb = this.objects.ballStates[0]
      if (!cb.active) return
      const touch = e.touches[0]
      if (!touch) return
      const rect = mount.getBoundingClientRect()
      const ndcX =  ((touch.clientX - rect.left) / rect.width)  * 2 - 1
      const ndcY = -((touch.clientY - rect.top)  / rect.height) * 2 + 1
      this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.objects.camera)
      if (this.raycaster.ray.intersectPlane(this.tablePlane, this.intersection)) {
        const dx = this.intersection.x - cb.mesh.position.x
        const dz = this.intersection.z - cb.mesh.position.z
        if (Math.hypot(dx, dz) > 0.01) this.state.aimAngle = Math.atan2(dz, dx)
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      if (!touch) return
      if (Math.hypot(touch.clientX - this.touchStartX, touch.clientY - this.touchStartY) < 10) {
        fireShot(this.objects, this.state, this.callbacks)
      }
    }

    this.reg(window, 'keydown', onKeyDown as (e: Event) => void)
    this.reg(window, 'keyup', onKeyUp as (e: Event) => void)
    this.reg(mount, 'mousemove', onMouseMove as (e: Event) => void)
    this.reg(mount, 'mousedown', onMouseDown as (e: Event) => void)
    this.reg(mount, 'mouseup', onMouseUp as (e: Event) => void)
    this.reg(mount, 'touchstart', onTouchStart as (e: Event) => void)
    this.reg(mount, 'touchmove', onTouchMove as (e: Event) => void)
    this.reg(mount, 'touchend', onTouchEnd as (e: Event) => void)
  }

  private buildResizeHandler(mount: HTMLDivElement): () => void {
    return () => {
      const nw = mount.clientWidth
      const nh = mount.clientHeight
      this.objects.camera.aspect = nw / nh
      this.objects.camera.updateProjectionMatrix()
      this.objects.renderer.setSize(nw, nh)
    }
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.frameId = requestAnimationFrame(animate)
      const dt = Math.min(this.objects.clock.getDelta(), 0.05)

      if (this.state.phase === 'aiming') {
        handleAiming(this.objects, this.state, this.callbacks, this.keys, dt)
      } else if (this.state.phase === 'rolling') {
        handleRolling(this.objects, this.state, this.callbacks, dt)
      }

      updateExplosionVisuals(this.objects, this.state, dt)
      this.objects.controls.update()
      this.objects.renderer.render(this.objects.scene, this.objects.camera)
    }
    animate()
  }
}
