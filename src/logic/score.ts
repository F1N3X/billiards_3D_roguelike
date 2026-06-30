import {
  SCORE_PER_BALL,
  COMBO_BONUS_PER_EXTRA,
  SCRATCH_PENALTY,
  VICTORY_BASE_BONUS,
  VICTORY_BONUS_PER_SHOT,
} from '../config/constants'

/**
 * Points pour un coup :
 * - 1ère boule : SCORE_PER_BALL
 * - chaque boule supplémentaire : +COMBO_BONUS_PER_EXTRA (combo)
 * - boule blanche empochée : SCRATCH_PENALTY
 */
export function computeShotScore(ballsPotted: number, scratch: boolean): number {
  let pts = 0
  for (let i = 0; i < ballsPotted; i++) {
    pts += SCORE_PER_BALL + i * COMBO_BONUS_PER_EXTRA
  }
  if (scratch) pts += SCRATCH_PENALTY
  return pts
}

/**
 * Bonus de fin de partie basé sur le nombre de coups.
 * Diminue de VICTORY_BONUS_PER_SHOT par coup, minimum 0.
 */
export function computeVictoryBonus(shots: number): number {
  return Math.max(0, VICTORY_BASE_BONUS - shots * VICTORY_BONUS_PER_SHOT)
}
