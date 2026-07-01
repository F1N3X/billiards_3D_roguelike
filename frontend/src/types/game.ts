export type GameMode = 'classic' | 'rumble'

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  classic: 'Mode Classique',
  rumble: 'Mode Rumble',
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
