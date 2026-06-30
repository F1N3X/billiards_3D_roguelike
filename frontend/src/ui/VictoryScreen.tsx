import styles from './VictoryScreen.module.css'

interface Props {
  totalScore: number
  ballScore: number
  victoryBonus: number
  shots: number
  savedStatus: 'idle' | 'saving' | 'saved' | 'error' | null
  onReplay: () => void
  onMenu: () => void
}

const SAVED_LABEL: Record<NonNullable<Props['savedStatus']>, string> = {
  idle: '',
  saving: 'Sauvegarde...',
  saved: 'Partie sauvegardée',
  error: 'Erreur de sauvegarde',
}

export function VictoryScreen({ totalScore, ballScore, victoryBonus, shots, savedStatus, onReplay, onMenu }: Props) {
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

        {savedStatus && savedStatus !== 'idle' && (
          <div className={savedStatus === 'error' ? styles.saveError : styles.saveStatus}>
            {SAVED_LABEL[savedStatus]}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.replayButton} onClick={onReplay}>
            Rejouer
          </button>
          <button className={styles.menuButton} onClick={onMenu}>
            Menu
          </button>
        </div>
      </div>
    </div>
  )
}
