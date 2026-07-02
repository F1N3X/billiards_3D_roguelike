import { useReducer, useEffect, useState, useRef } from 'react'
import { useAuth } from '../auth/use-auth'
import { startGameSession, saveGameHistory, fetchLeaderboard, fetchPlayerStats } from '../api/api'
import BilliardsScene from '../BilliardsScene'
import { GameDashboard } from '../ui/GameDashboard'
import { VictoryScreen } from '../ui/VictoryScreen'
import { RumbleHud } from '../ui/RumbleHud'
import { reduce, initialGameState } from '../logic/game-reducer'
import { drawHand } from '../logic/power-up-pool'
import { RUMBLE_INITIAL_CURRENCY, RUMBLE_CURRENCY_PER_TURN, IS_DEV } from '../config/power-ups'
import type { LeaderboardEntry, PlayerStats } from '../types/game'
import type { PowerUp, BuffEffect } from '../game/powerups'
import styles from './screens.module.css'

export function RumbleGameScreen({ onMenu }: { onMenu: () => void }) {
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
  const sessionIdRef = useRef<string | null>(null)

  const refreshLeaderboard = () => {
    setLeaderboardLoading(true)
    fetchLeaderboard('rumble')
      .then(setLeaderboard)
      .catch(err => console.error('[RumbleGameScreen] fetchLeaderboard', err))
      .finally(() => setLeaderboardLoading(false))
  }

  useEffect(() => {
    fetchLeaderboard('rumble')
      .then(setLeaderboard)
      .catch(err => console.error('[RumbleGameScreen] fetchLeaderboard init', err))
      .finally(() => setLeaderboardLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    fetchPlayerStats(user._id, 'rumble')
      .then(setPlayerStats)
      .catch(err => console.error('[RumbleGameScreen] fetchPlayerStats', err))
  }, [user])

  useEffect(() => {
    if (!user || !user.token) return
    sessionIdRef.current = null
    startGameSession('rumble', user.token)
      .then(({ sessionId }) => { sessionIdRef.current = sessionId })
      .catch(err => console.error('[RumbleGameScreen] startGameSession', err))
  }, [user, gameState.gameKey])

  useEffect(() => {
    if (!gameState.victory || !user || !user.token || !sessionIdRef.current) return

    setSavedStatus('saving')
    saveGameHistory(user._id, 'rumble', gameState.victory.totalScore, gameState.victory.shots, user.token, sessionIdRef.current)
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
    <div className={styles.screen}>
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
