import { useEffect, useRef, type RefObject } from 'react'
import { BilliardsEngine } from '../engine/billiards-engine'
import type { BuffEffect } from '../game/powerups'

export function useBilliardsEngine(
  mountRef: RefObject<HTMLDivElement | null>,
  onShotResolved: (ballsPotted: number, scratch: boolean, isVictory: boolean) => void,
  onRollingChange?: (rolling: boolean) => void,
  activeEffects?: Set<BuffEffect>,
): void {
  const engineRef = useRef<BilliardsEngine | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    engineRef.current = new BilliardsEngine(mount, {
      onShotResolved,
      onRollingChange,
      activeEffects: activeEffects ?? new Set(),
    })
    return () => {
      engineRef.current?.dispose()
      engineRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    engineRef.current?.updateCallbacks({
      onShotResolved,
      onRollingChange,
      activeEffects: activeEffects ?? new Set(),
    })
  })
}
