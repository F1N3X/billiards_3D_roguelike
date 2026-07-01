export type BuffEffect = 'tripleShot' | 'tripleTriangle' | 'clone' | 'lockCornerPockets' | 'lockMiddlePockets' | 'explosiveShot' | 'cloneOnContact'

export interface Buff {
  readonly effect: BuffEffect
}

export type PowerUpId = 'triple_shot' | 'triple_shot_triangle' | 'clone' | 'lock_corner_pockets' | 'lock_middle_pockets' | 'explosive_shot' | 'clone_on_contact'

export interface PowerUp {
  readonly id: PowerUpId
  readonly name: string
  readonly description: string
  readonly cost: number
  createBuff(): Buff
}
