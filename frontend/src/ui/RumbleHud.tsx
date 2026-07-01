import type { PowerUp, BuffEffect } from '../game/powerups'
import styles from './RumbleHud.module.css'

interface Props {
  currency: number
  hand: (PowerUp | null)[]
  activeEffects: Set<BuffEffect>
  isRolling: boolean
  onToggle: (powerUp: PowerUp) => void
}

export function RumbleHud({ currency, hand, activeEffects, isRolling, onToggle }: Props) {
  return (
    <div className={styles.hud}>
      <div className={styles.currency}>
        <span className={styles.coinIcon}>◈</span>
        <span className={styles.coinValue}>{currency}</span>
        <span className={styles.coinLabel}>pièces</span>
      </div>
      <div className={styles.hand}>
        {hand.map((powerUp, i) => {
          if (!powerUp) {
            return (
              <div key={i} className={styles.cardLocked}>
                <span className={styles.lockIcon}>⌖</span>
                <span className={styles.lockText}>Bientôt</span>
              </div>
            )
          }
          const buff = powerUp.createBuff()
          const isActive = activeEffects.has(buff.effect)
          const canAfford = currency >= powerUp.cost
          const isDisabled = isRolling || (!canAfford && !isActive)

          return (
            <button
              key={powerUp.id}
              className={[
                styles.card,
                isActive ? styles.cardActive : '',
                isDisabled ? styles.cardDisabled : '',
              ].join(' ')}
              onClick={() => onToggle(powerUp)}
              disabled={isDisabled}
              title={isActive ? 'Cliquer pour annuler' : powerUp.description}
            >
              {isActive && <div className={styles.activeTag}>✕ ACTIF</div>}
              <div className={styles.cardIcon}>{powerUp.icon}</div>
              <div className={styles.cardName}>{powerUp.name}</div>
              <div className={styles.cardDesc}>{powerUp.description}</div>
              <div className={styles.cardCost}>
                <span className={styles.coinSmall}>◈</span>
                {powerUp.cost}
              </div>
            </button>
          )
        })}
      </div>
      {isRolling && <div className={styles.rollingHint}>Les boules roulent…</div>}
    </div>
  )
}
