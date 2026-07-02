import { computeShotScore, computeVictoryBonus } from './score'

export interface GameState {
  gameKey: number
  score: number
  shots: number
  victory: { totalScore: number; ballScore: number; victoryBonus: number; shots: number } | null
}

export type GameAction =
  | { type: 'shot_resolved'; ballsPotted: number; scratch: boolean; isVictory: boolean }
  | { type: 'replay' }
  | { type: 'reset' }

export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'shot_resolved': {
      const newShots = state.shots + 1
      const shotPoints = computeShotScore(action.ballsPotted, action.scratch)
      const bonus = action.isVictory ? computeVictoryBonus(newShots) : 0
      const newScore = state.score + shotPoints + bonus
      return {
        ...state,
        score: newScore,
        shots: newShots,
        victory: action.isVictory
          ? { totalScore: newScore, ballScore: state.score + shotPoints, victoryBonus: bonus, shots: newShots }
          : null,
      }
    }
    case 'replay':
      return { gameKey: state.gameKey + 1, score: 0, shots: 0, victory: null }
    case 'reset':
      return { gameKey: state.gameKey + 1, score: 0, shots: 0, victory: null }
  }
}

export const initialGameState: GameState = { gameKey: 0, score: 0, shots: 0, victory: null }
