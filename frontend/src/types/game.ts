export type GameMode = 'classic'

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  classic: 'Mode Classique',
}

export interface LeaderboardEntry {
  rank: number
  pseudo: string
  score: number
  shots: number
  rankingScore: number
}

export interface PlayerStats {
  avgScore: number
  avgShots: number
  bestScore: number
  gamesCount: number
}
