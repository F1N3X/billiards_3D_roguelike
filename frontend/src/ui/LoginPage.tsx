import { useEffect, useState } from 'react'
import { login, register } from '../api/api'
import { useAuth } from '../auth/use-auth'
import styles from './LoginPage.module.css'

type Tab = 'login' | 'register'

interface Props {
  onBack: () => void
}

export function LoginPage({ onBack }: Props) {
  const { signIn } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onBack])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = tab === 'login'
        ? await login(email, password)
        : await register(pseudo, email, password)
      signIn(user)
      onBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('[LoginPage]', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <button className={styles.backButton} onClick={onBack} title="Echap">
          ← Retour
        </button>

        <div className={styles.tabs}>
          <button
            className={tab === 'login' ? styles.tabActive : styles.tab}
            onClick={() => { setTab('login'); setError(null) }}
          >
            Connexion
          </button>
          <button
            className={tab === 'register' ? styles.tabActive : styles.tab}
            onClick={() => { setTab('register'); setError(null) }}
          >
            Inscription
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {tab === 'register' && (
            <label className={styles.field}>
              <span>Pseudo</span>
              <input
                className={styles.input}
                type="text"
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </label>
          )}

          <label className={styles.field}>
            <span>Email</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus={tab === 'login'}
              autoComplete="email"
            />
          </label>

          <label className={styles.field}>
            <span>Mot de passe</span>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submitButton} type="submit" disabled={loading}>
            {loading ? '...' : tab === 'login' ? 'Se connecter' : 'Créer le compte'}
          </button>
        </form>
      </div>
    </div>
  )
}
