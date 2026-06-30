import styles from './GameHud.module.css'

interface Props {
  score: number
  shots: number
}

export function GameHud({ score, shots }: Props) {
  return (
    <div className={styles.hud}>
      <div className={styles.block}>
        <div className={styles.label}>Score</div>
        <div className={styles.value}>{score}</div>
      </div>
      <div className={styles.block}>
        <div className={styles.label}>Coups</div>
        <div className={styles.value}>{shots}</div>
      </div>
    </div>
  )
}
