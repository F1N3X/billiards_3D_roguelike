import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createContext, useContext, type ReactNode } from 'react'
import { MainMenu } from './MainMenu'
import { LoginPage } from './LoginPage'
import { AccountPage } from './AccountPage'
import type { AuthUser } from '../types/user'

vi.mock('../api/api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  updatePseudo: vi.fn(),
  saveGameHistory: vi.fn(),
  fetchLeaderboard: vi.fn().mockResolvedValue([]),
  fetchPlayerStats: vi.fn().mockResolvedValue(null),
}))

interface AuthContextValue {
  user: AuthUser | null
  signIn: (user: AuthUser) => void
  signOut: () => void
  updateUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

vi.mock('../auth/auth-context', () => ({
  useAuth: () => useContext(AuthContext),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}))

function makeAuthValue(user: AuthUser | null): AuthContextValue {
  return {
    user,
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateUser: vi.fn(),
  }
}

function renderWithUser(ui: React.ReactElement, user: AuthUser | null = null) {
  const value = makeAuthValue(user)
  return {
    ...render(<AuthContext.Provider value={value}>{ui}</AuthContext.Provider>),
    authValue: value,
  }
}

const fakeUser: AuthUser = { _id: '123', pseudo: 'Joueur1', email: 'test@test.com', token: 'fake-jwt-token' }

describe('MainMenu', () => {
  const onPlay = vi.fn()
  const onLogin = vi.fn()
  const onAccount = vi.fn()

  beforeEach(() => {
    onPlay.mockClear()
    onLogin.mockClear()
    onAccount.mockClear()
  })

  it('affiche le bouton Mode Classique', () => {
    renderWithUser(<MainMenu onPlay={onPlay} onPlayRumble={vi.fn()} onLogin={onLogin} onAccount={onAccount} />)
    expect(screen.getByRole('button', { name: /Mode Classique/ })).toBeInTheDocument()
  })

  it('appelle onPlay au clic sur Mode Classique', async () => {
    renderWithUser(<MainMenu onPlay={onPlay} onPlayRumble={vi.fn()} onLogin={onLogin} onAccount={onAccount} />)
    await userEvent.click(screen.getByRole('button', { name: /Mode Classique/ }))
    expect(onPlay).toHaveBeenCalledOnce()
  })

  it('appelle onPlay à la touche Entrée', () => {
    renderWithUser(<MainMenu onPlay={onPlay} onPlayRumble={vi.fn()} onLogin={onLogin} onAccount={onAccount} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onPlay).toHaveBeenCalledOnce()
  })

  it('affiche Connexion si non connecté', () => {
    renderWithUser(<MainMenu onPlay={onPlay} onPlayRumble={vi.fn()} onLogin={onLogin} onAccount={onAccount} />, null)
    expect(screen.getByText('Connexion / Inscription')).toBeInTheDocument()
  })

  it('affiche Mon Compte si connecté', () => {
    renderWithUser(<MainMenu onPlay={onPlay} onPlayRumble={vi.fn()} onLogin={onLogin} onAccount={onAccount} />, fakeUser)
    expect(screen.getByText('Mon Compte')).toBeInTheDocument()
    expect(screen.queryByText('Connexion / Inscription')).not.toBeInTheDocument()
  })

  it('affiche le pseudo du joueur connecté', () => {
    renderWithUser(<MainMenu onPlay={onPlay} onPlayRumble={vi.fn()} onLogin={onLogin} onAccount={onAccount} />, fakeUser)
    expect(screen.getByText('Joueur1')).toBeInTheDocument()
  })

  it('appelle onLogin au clic sur Connexion', async () => {
    renderWithUser(<MainMenu onPlay={onPlay} onPlayRumble={vi.fn()} onLogin={onLogin} onAccount={onAccount} />, null)
    await userEvent.click(screen.getByText('Connexion / Inscription'))
    expect(onLogin).toHaveBeenCalledOnce()
  })
})

describe('LoginPage', () => {
  const onBack = vi.fn()

  beforeEach(() => onBack.mockClear())

  it('affiche le formulaire de connexion par défaut', () => {
    renderWithUser(<LoginPage onBack={onBack} />)
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
  })

  it('appelle onBack à la touche Echap', () => {
    renderWithUser(<LoginPage onBack={onBack} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('appelle onBack au clic sur Retour', async () => {
    renderWithUser(<LoginPage onBack={onBack} />)
    await userEvent.click(screen.getByText(/Retour/))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('bascule vers le formulaire inscription', async () => {
    renderWithUser(<LoginPage onBack={onBack} />)
    await userEvent.click(screen.getByText('Inscription'))
    expect(screen.getByRole('button', { name: 'Créer le compte' })).toBeInTheDocument()
    expect(screen.getByText('Pseudo')).toBeInTheDocument()
  })
})

describe('AccountPage', () => {
  const onBack = vi.fn()

  beforeEach(() => onBack.mockClear())

  it("affiche l'email et le pseudo de l'utilisateur", () => {
    renderWithUser(<AccountPage onBack={onBack} />, fakeUser)
    expect(screen.getByText('test@test.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Joueur1')).toBeInTheDocument()
  })

  it('appelle onBack à la touche Echap', () => {
    renderWithUser(<AccountPage onBack={onBack} />, fakeUser)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('le bouton Enregistrer est désactivé si pseudo inchangé', () => {
    renderWithUser(<AccountPage onBack={onBack} />, fakeUser)
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
  })
})
