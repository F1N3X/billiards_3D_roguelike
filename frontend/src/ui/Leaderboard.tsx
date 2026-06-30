import type { LeaderboardEntry } from '../types/game'
import styles from './Leaderboard.module.css'

interface Props {
  entries: LeaderboardEntry[]
  currentUserPseudo?: string | null
  loading?: boolean
}

export function Leaderboard({ entries, currentUserPseudo, loading = false }: Props) {
  if (loading) {
    return <p className={styles.empty}>Chargement...</p>
  }

  if (entries.length === 0) {
    return <p className={styles.empty}>Aucune partie enregistrée</p>
  }

  return (
    <div className={styles.table}>
      <div className={styles.header}>
        <span className={styles.colRank}>#</span>
        <span className={styles.colPseudo}>Joueur</span>
        <span className={styles.colRanking} title="Score ÷ coups">Pts/coup</span>
        <span className={styles.colScore}>Score</span>
        <span className={styles.colShots}>Coups</span>
      </div>
      {entries.map(entry => {
        const isMe = currentUserPseudo != null && entry.pseudo === currentUserPseudo
        return (
          <div key={entry.rank} className={isMe ? styles.rowMe : styles.row}>
            <span className={styles.colRank}>{entry.rank}</span>
            <span className={styles.colPseudo}>{entry.pseudo}</span>
            <span className={styles.colRanking}>{entry.rankingScore}</span>
            <span className={styles.colScore}>{entry.score}</span>
            <span className={styles.colShots}>{entry.shots}</span>
          </div>
        )
      })}
    </div>
  )
}
