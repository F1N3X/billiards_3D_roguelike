import { useRef } from 'react'
import { useBilliardsEngine } from './hooks/use-billiards-engine'
import type { BuffEffect } from './game/powerups'

interface Props {
  onShotResolved: (ballsPotted: number, scratch: boolean, isVictory: boolean) => void
  onRollingChange?: (rolling: boolean) => void
  activeEffects?: Set<BuffEffect>
}

export default function BilliardsScene({ onShotResolved, onRollingChange, activeEffects }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  useBilliardsEngine(mountRef, onShotResolved, onRollingChange, activeEffects)
  return <div ref={mountRef} style={{ width: '100%', height: '100vh', touchAction: 'none' }} />
}
