import type { PowerUp, PowerUpId } from './types'
import { tripleShot } from './triple-shot'
import { tripleTriangle } from './triple-triangle'
import { clone } from './clone'
import { lockCornerPockets } from './lock-corner-pockets'
import { lockMiddlePockets } from './lock-middle-pockets'
import { explosiveShot } from './explosive-shot'
import { cloneOnContact } from './clone-on-contact'

const REGISTRY = new Map<PowerUpId, PowerUp>([
  ['triple_shot', tripleShot],
  ['triple_shot_triangle', tripleTriangle],
  ['clone', clone],
  ['lock_corner_pockets', lockCornerPockets],
  ['lock_middle_pockets', lockMiddlePockets],
  ['explosive_shot', explosiveShot],
  ['clone_on_contact', cloneOnContact],
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
