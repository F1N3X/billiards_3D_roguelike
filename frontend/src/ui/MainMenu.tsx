import { useEffect } from 'react'
import { useAuth } from '../auth/auth-context'
import styles from './MainMenu.module.css'

interface Props {
  onPlay: () => void
  onLogin: () => void
  onAccount: () => void
}

export function MainMenu({ onPlay, onLogin, onAccount }: Props) {
  const { user, signOut } = useAuth()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onPlay()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onPlay])

  return (
    <div className={styles.page}>
      <div className={styles.content}>
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
    </div>
  )
}
