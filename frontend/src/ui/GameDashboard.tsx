import { useAuth } from '../auth/use-auth'
import { Leaderboard } from './Leaderboard'
import type { LeaderboardEntry, PlayerStats, GameMode } from '../types/game'
import { GAME_MODE_LABELS } from '../types/game'
import styles from './GameDashboard.module.css'

interface Props {
  gameMode: GameMode
  score: number
  shots: number
  leaderboard: LeaderboardEntry[]
  playerStats: PlayerStats | null
  leaderboardLoading: boolean
}

export function GameDashboard({ gameMode, score, shots, leaderboard, playerStats, leaderboardLoading }: Props) {
  const { user } = useAuth()

  return (
    <>
      {/* Top-left: current player stats */}
      <aside className={styles.statsCard}>
        <div className={styles.cardLabel}>Partie en cours</div>
        <div className={styles.statsGrid}>
          <span className={styles.statLabel}>Score</span>
          <span className={styles.statValue}>{score}</span>
          <span className={styles.statLabel}>Coups</span>
          <span className={styles.statValue}>{shots}</span>
          {user && playerStats && (
            <>
              <span className={styles.statLabel}>Moy. score</span>
              <span className={styles.statValue}>{playerStats.avgScore}</span>
              <span className={styles.statLabel}>Moy. coups</span>
              <span className={styles.statValue}>{playerStats.avgShots}</span>
            </>
          )}
        </div>
      </aside>

      {/* Top-right: global leaderboard */}
      <aside className={styles.leaderboardCard}>
        <div className={styles.cardLabel}>{GAME_MODE_LABELS[gameMode]} — Classement</div>
        <Leaderboard
          entries={leaderboard}
          currentUserPseudo={user?.pseudo ?? null}
          loading={leaderboardLoading}
        />
        {!user && leaderboard.length > 0 && (
          <p className={styles.loginHint}>Connectez-vous pour apparaître</p>
        )}
      </aside>
    </>
  )
}
