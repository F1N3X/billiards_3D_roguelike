import type { PowerUp, PowerUpId } from './types'
import { tripleShot } from './triple-shot'
import { tripleTriangle } from './triple-triangle'
import { clone } from './clone'

const REGISTRY = new Map<PowerUpId, PowerUp>([
  ['triple_shot', tripleShot],
  ['triple_shot_triangle', tripleTriangle],
  ['clone', clone],
])

export const PowerUpRegistry = {
  get(id: PowerUpId): PowerUp {
    const pu = REGISTRY.get(id)
    if (!pu) throw new Error(`[PowerUpRegistry] unknown power-up: ${id}`)
    return pu
  },
  all(): PowerUp[] {
    return Array.from(REGISTRY.values())
  },
}
