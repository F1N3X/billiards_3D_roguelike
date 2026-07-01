import type { PowerUp, PowerUpId } from './types'
import { tripleShot } from './triple-shot'
import { tripleTriangle } from './triple-triangle'
import { clone } from './clone'
import { lockCornerPockets } from './lock-corner-pockets'
import { lockMiddlePockets } from './lock-middle-pockets'
import { explosiveShot } from './explosive-shot'
import { cloneOnContact } from './clone-on-contact'
import { seisme } from './seisme'
import { bouncyWalls } from './bouncy-walls'
import { slipperyFelt } from './slippery-felt'
import { stickyFelt } from './sticky-felt'
import { magneticCue } from './magnetic-cue'

const REGISTRY = new Map<PowerUpId, PowerUp>([
  ['triple_shot', tripleShot],
  ['triple_shot_triangle', tripleTriangle],
  ['clone', clone],
  ['lock_corner_pockets', lockCornerPockets],
  ['lock_middle_pockets', lockMiddlePockets],
  ['explosive_shot', explosiveShot],
  ['clone_on_contact', cloneOnContact],
  ['seisme', seisme],
  ['bouncy_walls', bouncyWalls],
  ['slippery_felt', slipperyFelt],
  ['sticky_felt', stickyFelt],
  ['magnetic_cue', magneticCue],
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
