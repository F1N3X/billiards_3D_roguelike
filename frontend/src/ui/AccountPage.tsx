import { useEffect, useState } from 'react'
import { updatePseudo } from '../api/api'
import { useAuth } from '../auth/auth-context'
import styles from './AccountPage.module.css'

interface Props {
  onBack: () => void
}

export function AccountPage({ onBack }: Props) {
  const { user, updateUser, signOut } = useAuth()
  const [pseudo, setPseudo] = useState(user?.pseudo ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onBack])

  if (!user) {
    onBack()
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSaved(false)
    setLoading(true)
    try {
      const updated = await updatePseudo(user._id, pseudo, user.token)
      updateUser({ ...updated, token: user.token })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('[AccountPage]', err)
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

        <h2 className={styles.title}>Mon Compte</h2>
        <p className={styles.email}>{user.email}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Pseudo</span>
            <input
              className={styles.input}
              type="text"
              value={pseudo}
              onChange={e => { setPseudo(e.target.value); setSaved(false) }}
              required
              autoFocus
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}
          {saved && <p className={styles.success}>Pseudo mis à jour !</p>}

          <button className={styles.saveButton} type="submit" disabled={loading || pseudo === user.pseudo}>
            {loading ? '...' : 'Enregistrer'}
          </button>
        </form>

        <button className={styles.logoutButton} onClick={() => { signOut(); onBack() }}>
          Déconnexion
        </button>
      </div>
    </div>
  )
}
