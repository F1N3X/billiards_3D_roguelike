/**
 * Validates game constants for logical consistency.
 * Source: frontend/src/config/constants.ts
 * Run: npx tsx scripts/validate-config.ts
 * Exit: 0 = all OK, 1 = at least one check failed
 */

// Mirrored from frontend/src/config/constants.ts
const BALL_RADIUS = 0.075
const TABLE_WIDTH = 4.5
const TABLE_LENGTH = 2.5
const POCKET_RADIUS = 0.13
const POCKET_INSET = POCKET_RADIUS * 0.55
const POCKET_XZ: [number, number][] = [
  [-(TABLE_WIDTH / 2 - POCKET_INSET), -(TABLE_LENGTH / 2 - POCKET_INSET)],
  [ TABLE_WIDTH / 2 - POCKET_INSET,  -(TABLE_LENGTH / 2 - POCKET_INSET)],
  [-(TABLE_WIDTH / 2 - POCKET_INSET),  TABLE_LENGTH / 2 - POCKET_INSET],
  [ TABLE_WIDTH / 2 - POCKET_INSET,   TABLE_LENGTH / 2 - POCKET_INSET],
  [0, -(TABLE_LENGTH / 2 - POCKET_INSET)],
  [0,  TABLE_LENGTH / 2 - POCKET_INSET],
]
const FRICTION = 0.978
const MIN_SPEED = 0.025
const MAX_BALL_SPEED = 8.0
const SHOT_POWER = 6.0
const BALL_COLORS_LENGTH = 16 // index 0 = cue, 1–15 = numbered
const SCORE_PER_BALL = 100
const COMBO_BONUS_PER_EXTRA = 50
const SCRATCH_PENALTY = -200
const VICTORY_BASE_BONUS = 2000
const VICTORY_BONUS_PER_SHOT = 100
const EXPLOSION_RADIUS = 0.9
const BOUNCY_WALLS_RESTITUTION = 1.3
const SLIPPERY_FRICTION = 0.993
const STICKY_FRICTION = 0.958
const MAGNET_RADIUS = 1.2
const MAX_SCORE_CLASSIC = 9_000 // from backend/src/game-sessions/game-sessions.service.ts

type CheckResult = { name: string; ok: boolean; detail: string }
const checks: CheckResult[] = []

function check(name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail })
}

// Pocket geometry
check('pocket > ball',
  POCKET_RADIUS > BALL_RADIUS,
  `pocket_radius=${POCKET_RADIUS} must be > ball_radius=${BALL_RADIUS}`)

check('pocket detection catches balls',
  POCKET_RADIUS * 1.4 > BALL_RADIUS,
  `detection zone=${(POCKET_RADIUS * 1.4).toFixed(4)} must be > ball_radius=${BALL_RADIUS}`)

check('pocket count = 6',
  POCKET_XZ.length === 6,
  `got ${POCKET_XZ.length} pockets, expected 6`)

for (const [px, pz] of POCKET_XZ) {
  check(
    `pocket(${px.toFixed(2)},${pz.toFixed(2)}) in table`,
    Math.abs(px) <= TABLE_WIDTH / 2 && Math.abs(pz) <= TABLE_LENGTH / 2,
    `pocket at (${px.toFixed(3)}, ${pz.toFixed(3)}) outside ±(${TABLE_WIDTH / 2}, ${TABLE_LENGTH / 2})`
  )
}

// Ball colors
check('ball colors = 16',
  BALL_COLORS_LENGTH === 16,
  `expected 16 (1 cue + 15 numbered), got ${BALL_COLORS_LENGTH}`)

// Physics
check('FRICTION in (0.9, 1.0)',
  FRICTION > 0.9 && FRICTION < 1.0,
  `FRICTION=${FRICTION}`)

check('MIN_SPEED << SHOT_POWER',
  MIN_SPEED < SHOT_POWER,
  `MIN_SPEED=${MIN_SPEED} vs SHOT_POWER=${SHOT_POWER}`)

check('MAX_BALL_SPEED >= SHOT_POWER',
  MAX_BALL_SPEED >= SHOT_POWER,
  `MAX_BALL_SPEED=${MAX_BALL_SPEED} vs SHOT_POWER=${SHOT_POWER}`)

check('BOUNCY_WALLS_RESTITUTION > 1',
  BOUNCY_WALLS_RESTITUTION > 1,
  `BOUNCY_WALLS_RESTITUTION=${BOUNCY_WALLS_RESTITUTION}`)

check('SLIPPERY_FRICTION in (0,1)',
  SLIPPERY_FRICTION > 0 && SLIPPERY_FRICTION < 1,
  `SLIPPERY_FRICTION=${SLIPPERY_FRICTION}`)

check('STICKY_FRICTION in (0,1)',
  STICKY_FRICTION > 0 && STICKY_FRICTION < 1,
  `STICKY_FRICTION=${STICKY_FRICTION}`)

check('SLIPPERY > STICKY',
  SLIPPERY_FRICTION > STICKY_FRICTION,
  `slippery=${SLIPPERY_FRICTION} must be > sticky=${STICKY_FRICTION} (less friction = higher coeff)`)

// Score
check('SCORE_PER_BALL > 0', SCORE_PER_BALL > 0, `SCORE_PER_BALL=${SCORE_PER_BALL}`)
check('COMBO_BONUS_PER_EXTRA >= 0', COMBO_BONUS_PER_EXTRA >= 0, `COMBO_BONUS_PER_EXTRA=${COMBO_BONUS_PER_EXTRA}`)
check('SCRATCH_PENALTY < 0', SCRATCH_PENALTY < 0, `SCRATCH_PENALTY=${SCRATCH_PENALTY}`)
check('VICTORY_BASE_BONUS > 0', VICTORY_BASE_BONUS > 0, `VICTORY_BASE_BONUS=${VICTORY_BASE_BONUS}`)
check('VICTORY_BONUS_PER_SHOT > 0', VICTORY_BONUS_PER_SHOT > 0, `VICTORY_BONUS_PER_SHOT=${VICTORY_BONUS_PER_SHOT}`)

const bonusZeroAt = VICTORY_BASE_BONUS / VICTORY_BONUS_PER_SHOT
check('victory bonus reachable (≤30 shots)',
  bonusZeroAt <= 30,
  `bonus zeroes at ${bonusZeroAt} shots — must be achievable in a real game`)

// Max score vs backend cap
const maxTheoScore = (() => {
  let pts = 0
  for (let i = 0; i < 15; i++) pts += SCORE_PER_BALL + i * COMBO_BONUS_PER_EXTRA
  pts += Math.max(0, VICTORY_BASE_BONUS - 1 * VICTORY_BONUS_PER_SHOT)
  return pts
})()
check('max theo score <= backend cap',
  maxTheoScore <= MAX_SCORE_CLASSIC,
  `max theoretical score ${maxTheoScore} exceeds backend cap ${MAX_SCORE_CLASSIC}`)

// Explosion / Magnet
check('EXPLOSION_RADIUS > BALL_RADIUS',
  EXPLOSION_RADIUS > BALL_RADIUS,
  `EXPLOSION_RADIUS=${EXPLOSION_RADIUS} vs BALL_RADIUS=${BALL_RADIUS}`)

check('MAGNET_RADIUS > BALL_RADIUS',
  MAGNET_RADIUS > BALL_RADIUS,
  `MAGNET_RADIUS=${MAGNET_RADIUS} vs BALL_RADIUS=${BALL_RADIUS}`)

// Output
let passed = 0
for (const c of checks) {
  if (c.ok) {
    console.log(`  ✓  ${c.name}`)
    passed++
  } else {
    console.log(`  ✗  ${c.name}`)
    console.log(`        → ${c.detail}`)
  }
}

console.log(`\n${passed}/${checks.length} checks passed`)
process.exit(passed === checks.length ? 0 : 1)
