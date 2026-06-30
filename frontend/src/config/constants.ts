export const BALL_RADIUS = 0.075
export const TABLE_WIDTH = 4.5
export const TABLE_LENGTH = 2.5
export const TABLE_HEIGHT = 0.1
export const FELT_COLOR = 0x2d7a2d
export const WOOD_COLOR = 0x8B4513
export const CUE_COLOR = 0xd4a017
export const POCKET_RADIUS = 0.13

export const CUE_LENGTH = 2.5
export const CUE_TIP_GAP = 0.05
export const SHOT_POWER = 6.0
export const FRICTION = 0.984
export const MIN_SPEED = 0.003
export const AIM_SPEED = 2.2

export const ROOM_W = 16
export const ROOM_D = 12
export const ROOM_H = 5.5
export const FLOOR_Y = -0.86

export const POCKET_INSET = POCKET_RADIUS * 0.55
export const POCKET_XZ: [number, number][] = [
  [-(TABLE_WIDTH / 2 - POCKET_INSET), -(TABLE_LENGTH / 2 - POCKET_INSET)],
  [ TABLE_WIDTH / 2 - POCKET_INSET,  -(TABLE_LENGTH / 2 - POCKET_INSET)],
  [-(TABLE_WIDTH / 2 - POCKET_INSET),  TABLE_LENGTH / 2 - POCKET_INSET],
  [ TABLE_WIDTH / 2 - POCKET_INSET,   TABLE_LENGTH / 2 - POCKET_INSET],
  [0, -(TABLE_LENGTH / 2 - POCKET_INSET)],
  [0,  TABLE_LENGTH / 2 - POCKET_INSET],
]

export const BALL_COLORS = [
  0xf5f5f5,
  0xf5e400, 0x1a1acc, 0xdd1111, 0x7700cc, 0xff6600, 0x006600, 0x800000, 0x111111,
  0xf5e400, 0x1a1acc, 0xdd1111, 0x7700cc, 0xff6600, 0x006600, 0x800000,
]

export const INITIAL_AIM_ANGLE = 0

export const SCORE_PER_BALL = 100
export const COMBO_BONUS_PER_EXTRA = 50
export const SCRATCH_PENALTY = -200
export const VICTORY_BASE_BONUS = 2000
export const VICTORY_BONUS_PER_SHOT = 100
