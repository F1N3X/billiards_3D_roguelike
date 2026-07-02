/**
 * Score reference table — all shot scenarios and victory bonuses.
 * Logic mirrors frontend/src/logic/score.ts
 * Run: npx tsx scripts/score-table.ts
 */

// From frontend/src/config/constants.ts
const SCORE_PER_BALL = 100
const COMBO_BONUS_PER_EXTRA = 50
const SCRATCH_PENALTY = -200
const VICTORY_BASE_BONUS = 2000
const VICTORY_BONUS_PER_SHOT = 100
const TOTAL_BALLS = 15
const MAX_SCORE_CLASSIC = 9_000 // backend cap (game-sessions.service.ts)

// Same logic as frontend/src/logic/score.ts
function shotScore(ballsPotted: number, scratch: boolean): number {
  let pts = 0
  for (let i = 0; i < ballsPotted; i++) pts += SCORE_PER_BALL + i * COMBO_BONUS_PER_EXTRA
  if (scratch) pts += SCRATCH_PENALTY
  return pts
}

function victoryBonus(shots: number): number {
  return Math.max(0, VICTORY_BASE_BONUS - shots * VICTORY_BONUS_PER_SHOT)
}

// --- Shot score table ---
console.log('=== Score par coup ===\n')
console.log('  Balls | No scratch | Scratch | Combo breakdown')
console.log('  ------+------------+---------+-----------------------------')

for (let b = 0; b <= Math.min(6, TOTAL_BALLS); b++) {
  const normal = shotScore(b, false)
  const scratch = shotScore(b, true)
  const breakdown = Array.from({ length: b }, (_, i) => SCORE_PER_BALL + i * COMBO_BONUS_PER_EXTRA).join(' + ') || '—'
  console.log(`    ${String(b).padStart(3)} | ${String(normal).padStart(10)} | ${String(scratch).padStart(7)} | ${breakdown}`)
}

if (TOTAL_BALLS > 6) {
  console.log(`    ...`)
  const allAtOnce = shotScore(TOTAL_BALLS, false)
  console.log(`    ${String(TOTAL_BALLS).padStart(3)} | ${String(allAtOnce).padStart(10)} | ${String(shotScore(TOTAL_BALLS, true)).padStart(7)} | (max combo, ${TOTAL_BALLS} balls)`)
}

// --- Victory bonus table ---
console.log('\n=== Bonus de victoire ===\n')
console.log('  Shots | Bonus')
console.log('  ------+------')

const bonusZeroAt = Math.ceil(VICTORY_BASE_BONUS / VICTORY_BONUS_PER_SHOT)
for (let s = 1; s <= bonusZeroAt + 1; s++) {
  const bonus = victoryBonus(s)
  const tag = s === 1 ? ' ← max' : bonus === 0 ? ' ← no bonus beyond this' : ''
  console.log(`    ${String(s).padStart(3)} | ${String(bonus).padStart(5)}${tag}`)
}

// --- Score extremes ---
console.log('\n=== Scores extremes ===\n')

const maxTheorical = shotScore(TOTAL_BALLS, false) + victoryBonus(1)
const game3x5 = Array.from({ length: 5 }, () => shotScore(3, false)).reduce((a, b) => a + b, 0) + victoryBonus(5)
const game2x10 = Array.from({ length: 10 }, () => shotScore(2, false)).reduce((a, b) => a + b, 0) + victoryBonus(10)
const game1x15 = Array.from({ length: 15 }, () => shotScore(1, false)).reduce((a, b) => a + b, 0) + victoryBonus(15)

console.log(`  Théorique max (${TOTAL_BALLS} boules en 1 coup)  : ${maxTheorical}`)
console.log(`  Plafond backend classic               : ${MAX_SCORE_CLASSIC}`)
console.log(`  Réaliste ×3 boules, 5 coups           : ${game3x5}`)
console.log(`  Réaliste ×2 boules, 10 coups          : ${game2x10}`)
console.log(`  Minimal   ×1 boule,  15 coups         : ${game1x15}`)
console.log(`  Pénalité scratch                      : ${SCRATCH_PENALTY}`)
