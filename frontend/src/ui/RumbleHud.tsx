import { Lock, LockOpen } from 'lucide-react'
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
  rerollCost: number
  onToggle: (powerUp: PowerUp) => void
  onLock: (powerUp: PowerUp) => void
  onReroll: () => void
}

export function RumbleHud({
  currency,
  hand,
  activeEffects,
  lockedIndices,
  lockedThisTurn,
  isRolling,
  isDev,
  rerollCost,
  onToggle,
  onLock,
  onReroll,
}: Props) {
  const lockedCount = lockedIndices.size
  const allLocked = lockedCount === hand.length && hand.length > 0
  const canReroll = !allLocked && (isDev || currency >= rerollCost)

  return (
    <div className={styles.hud}>
      <div className={styles.topBar}>
        <div className={styles.currency}>
          <span className={styles.coinIcon}>◈</span>
          <span className={styles.coinValue}>{isDev ? '∞' : currency}</span>
          <span className={styles.coinLabel}>pièces</span>
        </div>
        <button
          className={[styles.rerollBtn, !canReroll || isRolling ? styles.rerollBtnDisabled : ''].join(' ')}
          onClick={onReroll}
          disabled={!canReroll || isRolling}
          title={
            isRolling
              ? 'Impossible pendant que les boules roulent'
              : allLocked
                ? 'Tous les bonus sont verrouillés'
                : !canReroll
                  ? `Pas assez de pièces (${rerollCost} ◈ requis)`
                  : lockedCount > 0
                    ? `Relancer les ${hand.length - lockedCount} bonus non verrouillés`
                    : 'Relancer tous les bonus'
          }
        >
          <span className={styles.rerollIcon}>↺</span>
          <span className={styles.rerollLabel}>Relancer</span>
          <span className={styles.rerollCost}>
            <span className={styles.coinSmall}>◈</span>
            {rerollCost}
          </span>
        </button>
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
                {isLocked ? <Lock size={13} strokeWidth={2.5} /> : <LockOpen size={13} strokeWidth={2.5} />}
              </button>
            </div>
          )
        })}
      </div>
      {isRolling && <div className={styles.rollingHint}>Les boules roulent…</div>}
    </div>
  )
}
