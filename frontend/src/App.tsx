import { useReducer, useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './auth/auth-context'
import { saveGameHistory } from './api/api'
import BilliardsScene from './BilliardsScene'
import { GameHud } from './ui/GameHud'
import { VictoryScreen } from './ui/VictoryScreen'
import { MainMenu } from './ui/MainMenu'
import { LoginPage } from './ui/LoginPage'
import { AccountPage } from './ui/AccountPage'
import { computeShotScore, computeVictoryBonus } from './logic/score'

type Page = 'menu' | 'login' | 'account' | 'game'

interface GameState {
  gameKey: number
  score: number
  shots: number
  victory: { totalScore: number; ballScore: number; victoryBonus: number; shots: number } | null
}

type GameAction =
  | { type: 'shot_resolved'; ballsPotted: number; scratch: boolean; isVictory: boolean }
  | { type: 'replay' }
  | { type: 'reset' }

function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'shot_resolved': {
      const newShots = state.shots + 1
      const shotPoints = computeShotScore(action.ballsPotted, action.scratch)
      const bonus = action.isVictory ? computeVictoryBonus(newShots) : 0
      const newScore = state.score + shotPoints + bonus
      return {
        ...state,
        score: newScore,
        shots: newShots,
        victory: action.isVictory
          ? { totalScore: newScore, ballScore: state.score + shotPoints, victoryBonus: bonus, shots: newShots }
          : null,
      }
    }
    case 'replay':
      return { gameKey: state.gameKey + 1, score: 0, shots: 0, victory: null }
    case 'reset':
      return { gameKey: state.gameKey + 1, score: 0, shots: 0, victory: null }
  }
}

const initialGameState: GameState = { gameKey: 0, score: 0, shots: 0, victory: null }

function GameScreen({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth()
  const [gameState, dispatch] = useReducer(reduce, initialGameState)
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (!gameState.victory || !user) return

    setSavedStatus('saving')
    saveGameHistory(user._id, gameState.victory.totalScore, gameState.victory.shots)
      .then(() => setSavedStatus('saved'))
      .catch(err => {
        setSavedStatus('error')
        console.error('[GameScreen] saveGameHistory failed', err)
      })
  }, [gameState.victory, user])

  const handleShotResolved = (ballsPotted: number, scratch: boolean, isVictory: boolean) => {
    dispatch({ type: 'shot_resolved', ballsPotted, scratch, isVictory })
  }

  const handleReplay = () => {
    setSavedStatus('idle')
    dispatch({ type: 'replay' })
  }

  const handleMenu = () => {
    dispatch({ type: 'reset' })
    setSavedStatus('idle')
    onMenu()
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <BilliardsScene
        key={gameState.gameKey}
        onShotResolved={handleShotResolved}
      />
      <GameHud score={gameState.score} shots={gameState.shots} />
      {gameState.victory && (
        <VictoryScreen
          totalScore={gameState.victory.totalScore}
          ballScore={gameState.victory.ballScore}
          victoryBonus={gameState.victory.victoryBonus}
          shots={gameState.victory.shots}
          savedStatus={user ? savedStatus : null}
          onReplay={handleReplay}
          onMenu={handleMenu}
        />
      )}
    </div>
  )
}

function AppRouter() {
  const [page, setPage] = useState<Page>('menu')

  return (
    <>
      {page === 'menu' && (
        <MainMenu
          onPlay={() => setPage('game')}
          onLogin={() => setPage('login')}
          onAccount={() => setPage('account')}
        />
      )}
      {page === 'login' && <LoginPage onBack={() => setPage('menu')} />}
      {page === 'account' && <AccountPage onBack={() => setPage('menu')} />}
      {page === 'game' && <GameScreen onMenu={() => setPage('menu')} />}
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
