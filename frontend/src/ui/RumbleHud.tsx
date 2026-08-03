import type { PowerUp, BuffEffect } from '../game/powerups'
import styles from './RumbleHud.module.css'

interface Props {
  currency: number
  hand: PowerUp[]
  activeEffects: Set<BuffEffect>
  lockedIndices: Set<number>
  lockedThisTurn: Set<number>
  isRolling: boolean
  isDev?: boolean
  onToggle: (powerUp: PowerUp) => void
  onLock: (powerUp: PowerUp) => void
}

export function RumbleHud({
  currency,
  hand,
  activeEffects,
  lockedIndices,
  lockedThisTurn,
  isRolling,
  isDev,
  onToggle,
  onLock,
}: Props) {
  return (
    <div className={styles.hud}>
      <div className={styles.currency}>
        <span className={styles.coinIcon}>◈</span>
        <span className={styles.coinValue}>{isDev ? '∞' : currency}</span>
        <span className={styles.coinLabel}>pièces</span>
      </div>
      <div className={styles.hand}>
        {hand.map((powerUp, idx) => {
          const buff = powerUp.createBuff()
          const isActive = activeEffects.has(buff.effect)
          const isLocked = lockedIndices.has(idx)
          const isFreshLock = lockedThisTurn.has(idx)
          const canAfford = isDev || currency >= powerUp.cost
          const canActivate = !isFreshLock && !isRolling && (canAfford || isActive)

          return (
            <div key={idx} className={styles.cardWrapper}>
              <button
                className={[
                  styles.card,
                  isActive ? styles.cardActive : '',
                  isFreshLock ? styles.cardLockedFresh : '',
                  !canActivate && !isActive ? styles.cardDisabled : '',
                ].join(' ')}
                onClick={() => onToggle(powerUp)}
                disabled={!canActivate && !isActive}
                title={
                  isFreshLock
                    ? 'Verrouillé ce tour — disponible au prochain coup'
                    : isActive
                      ? 'Cliquer pour annuler'
                      : powerUp.description
                }
              >
                {isActive && <div className={styles.activeTag}>✕ ACTIF</div>}
                <div className={styles.cardName}>{powerUp.name}</div>
                <div className={styles.cardDesc}>{powerUp.description}</div>
                <div className={styles.cardCost}>
                  <span className={styles.coinSmall}>◈</span>
                  {powerUp.cost}
                </div>
              </button>
              <button
                className={[styles.lockBtn, isLocked ? styles.lockBtnActive : ''].join(' ')}
                onClick={() => onLock(powerUp)}
                disabled={isRolling}
                title={isLocked ? 'Déverrouiller' : 'Conserver pour le prochain tour'}
                aria-label={isLocked ? `Déverrouiller ${powerUp.name}` : `Verrouiller ${powerUp.name}`}
              >
                {isLocked ? '🔒' : '🔓'}
              </button>
            </div>
          )
        })}
      </div>
      {isRolling && <div className={styles.rollingHint}>Les boules roulent…</div>}
    </div>
  )
}
