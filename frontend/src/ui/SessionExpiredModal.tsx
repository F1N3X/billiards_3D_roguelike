import styles from './SessionExpiredModal.module.css'

interface Props {
  onReconnect: () => void
  onContinue: () => void
}

export function SessionExpiredModal({ onReconnect, onContinue }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.icon}>⚠</div>
        <h2 className={styles.title}>Session expirée</h2>
        <p className={styles.message}>
          Votre session a expiré. Vous n'êtes plus authentifié et votre partie
          ne sera pas sauvegardée.
        </p>
        <div className={styles.actions}>
          <button className={styles.reconnectButton} onClick={onReconnect}>
            Se reconnecter
          </button>
          <button className={styles.continueButton} onClick={onContinue}>
            Continuer sans compte
          </button>
        </div>
      </div>
    </div>
  )
}
