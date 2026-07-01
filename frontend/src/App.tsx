import { useReducer, useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './auth/auth-context'
import { saveGameHistory, fetchLeaderboard, fetchPlayerStats } from './api/api'
import BilliardsScene from './BilliardsScene'
import { GameDashboard } from './ui/GameDashboard'
import { VictoryScreen } from './ui/VictoryScreen'
import { MainMenu } from './ui/MainMenu'
import { LoginPage } from './ui/LoginPage'
import { AccountPage } from './ui/AccountPage'
import { RumbleHud } from './ui/RumbleHud'
import { computeShotScore, computeVictoryBonus } from './logic/score'
import { drawHand } from './logic/power-up-pool'
import { RUMBLE_INITIAL_CURRENCY, RUMBLE_CURRENCY_PER_TURN, IS_DEV } from './config/power-ups'
import type { LeaderboardEntry, PlayerStats } from './types/game'
import type { PowerUp, BuffEffect } from './game/powerups'

type Page = 'menu' | 'login' | 'account' | 'game' | 'rumble'

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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)

  const refreshLeaderboard = () => {
    setLeaderboardLoading(true)
    fetchLeaderboard('classic')
      .then(setLeaderboard)
      .catch(err => console.error('[GameScreen] fetchLeaderboard', err))
      .finally(() => setLeaderboardLoading(false))
  }

  useEffect(() => {
    refreshLeaderboard()
  }, [])

  useEffect(() => {
    if (!user) return
    fetchPlayerStats(user._id, 'classic')
      .then(setPlayerStats)
      .catch(err => console.error('[GameScreen] fetchPlayerStats', err))
  }, [user])

  useEffect(() => {
    if (!gameState.victory || !user) return

    setSavedStatus('saving')
    saveGameHistory(user._id, 'classic', gameState.victory.totalScore, gameState.victory.shots)
      .then(() => {
        setSavedStatus('saved')
        refreshLeaderboard()
        fetchPlayerStats(user._id, 'classic')
          .then(setPlayerStats)
          .catch(err => console.error('[GameScreen] fetchPlayerStats post-save', err))
      })
      .catch(err => {
        setSavedStatus('error')
        console.error('[GameScreen] saveGameHistory', err)
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
      <GameDashboard
        gameMode="classic"
        score={gameState.score}
        shots={gameState.shots}
        leaderboard={leaderboard}
        playerStats={playerStats}
        leaderboardLoading={leaderboardLoading}
      />
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

function RumbleGameScreen({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth()
  const [gameState, dispatch] = useReducer(reduce, initialGameState)
  const [currency, setCurrency] = useState(RUMBLE_INITIAL_CURRENCY)
  const [hand, setHand] = useState<PowerUp[]>(drawHand)
  const [activeEffects, setActiveEffects] = useState<Set<BuffEffect>>(new Set())
  const [isRolling, setIsRolling] = useState(false)
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)

  const refreshLeaderboard = () => {
    setLeaderboardLoading(true)
    fetchLeaderboard('rumble')
      .then(setLeaderboard)
      .catch(err => console.error('[RumbleGameScreen] fetchLeaderboard', err))
      .finally(() => setLeaderboardLoading(false))
  }

  useEffect(() => {
    refreshLeaderboard()
  }, [])

  useEffect(() => {
    if (!user) return
    fetchPlayerStats(user._id, 'rumble')
      .then(setPlayerStats)
      .catch(err => console.error('[RumbleGameScreen] fetchPlayerStats', err))
  }, [user])

  useEffect(() => {
    if (!gameState.victory || !user) return

    setSavedStatus('saving')
    saveGameHistory(user._id, 'rumble', gameState.victory.totalScore, gameState.victory.shots)
      .then(() => {
        setSavedStatus('saved')
        refreshLeaderboard()
        fetchPlayerStats(user._id, 'rumble')
          .then(setPlayerStats)
          .catch(err => console.error('[RumbleGameScreen] fetchPlayerStats post-save', err))
      })
      .catch(err => {
        setSavedStatus('error')
        console.error('[RumbleGameScreen] saveGameHistory', err)
      })
  }, [gameState.victory, user])

  const toggleBonus = (powerUp: PowerUp) => {
    const buff = powerUp.createBuff()
    if (activeEffects.has(buff.effect)) {
      if (!IS_DEV) setCurrency(c => c + powerUp.cost)
      setActiveEffects(prev => { const next = new Set(prev); next.delete(buff.effect); return next })
      return
    }
    if (!IS_DEV && currency < powerUp.cost) return
    if (!IS_DEV) setCurrency(c => c - powerUp.cost)
    setActiveEffects(prev => new Set([...prev, buff.effect]))
  }

  const handleShotResolved = (ballsPotted: number, scratch: boolean, isVictory: boolean) => {
    setActiveEffects(new Set())
    setCurrency(c => c + RUMBLE_CURRENCY_PER_TURN + ballsPotted)
    setHand(drawHand())
    dispatch({ type: 'shot_resolved', ballsPotted, scratch, isVictory })
  }

  const handleReplay = () => {
    setSavedStatus('idle')
    setCurrency(RUMBLE_INITIAL_CURRENCY)
    setActiveEffects(new Set())
    setHand(drawHand())
    dispatch({ type: 'replay' })
    refreshLeaderboard()
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
        onRollingChange={setIsRolling}
        activeEffects={activeEffects}
      />
      <GameDashboard
        gameMode="rumble"
        score={gameState.score}
        shots={gameState.shots}
        leaderboard={leaderboard}
        playerStats={playerStats}
        leaderboardLoading={leaderboardLoading}
      />
      <RumbleHud
        currency={currency}
        hand={hand}
        activeEffects={activeEffects}
        isRolling={isRolling}
        isDev={IS_DEV}
        onToggle={toggleBonus}
      />
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
