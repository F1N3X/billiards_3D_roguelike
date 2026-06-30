import styles from './VictoryScreen.module.css'

interface Props {
  totalScore: number
  ballScore: number
  victoryBonus: number
  shots: number
  onReplay: () => void
}

export function VictoryScreen({ totalScore, ballScore, victoryBonus, shots, onReplay }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.title}>VICTOIRE !</div>

        <div className={styles.scoreRow}>
          <span>Boules empochées</span>
          <span>{ballScore} pts</span>
        </div>
        {victoryBonus > 0 && (
          <div className={styles.scoreRow}>
            <span>Bonus rapidité</span>
            <span>+{victoryBonus} pts</span>
          </div>
        )}

        <hr className={styles.divider} />

        <div className={styles.totalRow}>
          <span>Total</span>
          <span>{totalScore} pts</span>
        </div>
        <div className={styles.shotsLabel}>{shots} coup{shots > 1 ? 's' : ''}</div>

        <button className={styles.replayButton} onClick={onReplay}>
          Rejouer
        </button>
      </div>
    </div>
  )
}
