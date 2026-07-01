import type { PowerUp } from '../game/powerups'
import { PowerUpRegistry } from '../game/powerups'
import { RUMBLE_HAND_SIZE } from '../config/power-ups'

export function drawHand(): PowerUp[] {
  const pool = [...PowerUpRegistry.all()]
  const take = Math.min(RUMBLE_HAND_SIZE, pool.length)
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, take)
}
