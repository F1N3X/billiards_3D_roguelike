import type { PowerUp } from '../game/powerups'
import { PowerUpRegistry } from '../game/powerups'
import { RUMBLE_HAND_SIZE } from '../config/power-ups'

export function drawInitialHand(): (PowerUp | null)[] {
  const pool = PowerUpRegistry.all()
  const hand: (PowerUp | null)[] = pool.slice(0, RUMBLE_HAND_SIZE)
  while (hand.length < RUMBLE_HAND_SIZE) hand.push(null)
  return hand
}
