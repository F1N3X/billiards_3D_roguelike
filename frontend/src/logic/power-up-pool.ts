import type { PowerUp } from '../game/powerups'
import { PowerUpRegistry } from '../game/powerups'
import { RUMBLE_HAND_SIZE } from '../config/power-ups'

function shuffleTake(pool: PowerUp[], take: number): PowerUp[] {
  const arr = [...pool]
  const n = Math.min(take, arr.length)
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (arr.length - i))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, n)
}

export function drawHand(): PowerUp[] {
  return shuffleTake(PowerUpRegistry.all(), RUMBLE_HAND_SIZE)
}

/**
 * Rebuilds the hand while keeping locked slots at their exact positions.
 * Non-locked slots get fresh random cards (excluding locked IDs).
 */
export function drawHandKeepingSlots(currentHand: PowerUp[], lockedIndices: Set<number>): PowerUp[] {
  const locked = new Map<number, PowerUp>()
  for (const i of lockedIndices) {
    if (i >= 0 && i < currentHand.length) locked.set(i, currentHand[i])
  }

  const lockedIds = new Set([...locked.values()].map(p => p.id))
  const fresh = shuffleTake(
    PowerUpRegistry.all().filter(p => !lockedIds.has(p.id)),
    RUMBLE_HAND_SIZE - locked.size,
  )

  const result: PowerUp[] = []
  let freshIdx = 0
  for (let i = 0; i < RUMBLE_HAND_SIZE; i++) {
    const lockedCard = locked.get(i)
    if (lockedCard) {
      result.push(lockedCard)
    } else if (freshIdx < fresh.length) {
      result.push(fresh[freshIdx++])
    }
  }
  return result
}
