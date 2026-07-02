import { useState } from 'react'
import { AuthProvider } from './auth/auth-context'
import { MainMenu } from './ui/MainMenu'
import { LoginPage } from './ui/LoginPage'
import { AccountPage } from './ui/AccountPage'
import { GameScreen } from './screens/GameScreen'
import { RumbleGameScreen } from './screens/RumbleGameScreen'

type Page = 'menu' | 'login' | 'account' | 'game' | 'rumble'

function AppRouter() {
  const [page, setPage] = useState<Page>('menu')

  return (
    <>
      {page === 'menu' && (
        <MainMenu
          onPlay={() => setPage('game')}
          onPlayRumble={() => setPage('rumble')}
          onLogin={() => setPage('login')}
          onAccount={() => setPage('account')}
        />
      )}
      {page === 'login' && <LoginPage onBack={() => setPage('menu')} />}
      {page === 'account' && <AccountPage onBack={() => setPage('menu')} />}
      {page === 'game' && <GameScreen onMenu={() => setPage('menu')} />}
      {page === 'rumble' && <RumbleGameScreen onMenu={() => setPage('menu')} />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
