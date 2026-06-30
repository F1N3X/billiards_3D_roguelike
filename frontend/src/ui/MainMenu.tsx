import { useEffect, useState } from 'react'
import { useAuth } from '../auth/auth-context'
import { fetchLeaderboard } from '../api/api'
import { Leaderboard } from './Leaderboard'
import type { LeaderboardEntry, GameMode } from '../types/game'
import { GAME_MODE_LABELS } from '../types/game'
import styles from './MainMenu.module.css'

const GAME_MODES: GameMode[] = ['classic']

interface Props {
  onPlay: () => void
  onLogin: () => void
  onAccount: () => void
}

export function MainMenu({ onPlay, onLogin, onAccount }: Props) {
  const { user, signOut } = useAuth()
  const [leaderboards, setLeaderboards] = useState<Partial<Record<GameMode, LeaderboardEntry[]>>>({})
  const [loadingModes, setLoadingModes] = useState<Set<GameMode>>(new Set(GAME_MODES))

  useEffect(() => {
    for (const mode of GAME_MODES) {
      fetchLeaderboard(mode)
        .then(entries => setLeaderboards(prev => ({ ...prev, [mode]: entries })))
        .catch(err => console.error('[MainMenu] fetchLeaderboard', err))
        .finally(() =>
          setLoadingModes(prev => { const next = new Set(prev); next.delete(mode); return next })
        )
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onPlay()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onPlay])

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <h1 className={styles.title}>Billard 3D</h1>
        <p className={styles.subtitle}>Roguelike</p>

        <nav className={styles.nav}>
          <button className={styles.primaryButton} onClick={onPlay}>
            Mode Classique
            <span className={styles.hint}>Entrée</span>
          </button>

          {user ? (
            <>
              <button className={styles.secondaryButton} onClick={onAccount}>
                Mon Compte
              </button>
              <button className={styles.logoutButton} onClick={signOut}>
                Déconnexion
              </button>
            </>
          ) : (
            <button className={styles.secondaryButton} onClick={onLogin}>
              Connexion / Inscription
            </button>
          )}
        </nav>

        {user && (
          <p className={styles.welcome}>
            Connecté : <strong>{user.pseudo}</strong>
          </p>
        )}
      </div>

      <div className={styles.right}>
        {GAME_MODES.map(mode => (
          <div key={mode} className={styles.leaderboardCard}>
            <h2 className={styles.cardTitle}>{GAME_MODE_LABELS[mode]}</h2>
            <div className={styles.cardSubtitle}>Classement — score moyen</div>
            <Leaderboard
              entries={leaderboards[mode] ?? []}
              currentUserPseudo={user?.pseudo ?? null}
              loading={loadingModes.has(mode)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
