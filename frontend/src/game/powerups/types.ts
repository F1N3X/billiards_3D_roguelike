export type BuffEffect = 'tripleShot' | 'tripleTriangle' | 'clone'

export interface Buff {
  readonly effect: BuffEffect
}

export type PowerUpId = 'triple_shot' | 'triple_shot_triangle' | 'clone'

export interface PowerUp {
  readonly id: PowerUpId
  readonly name: string
  readonly description: string
  readonly cost: number
  readonly icon: string
  createBuff(): Buff
}
