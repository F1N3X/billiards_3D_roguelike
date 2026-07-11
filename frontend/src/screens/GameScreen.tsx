import { useReducer, useEffect, useState } from 'react'
import { useAuth } from '../auth/use-auth'
import { startGameSession, saveGameHistory, fetchLeaderboard, fetchPlayerStats } from '../api/api'
import BilliardsScene from '../BilliardsScene'
import { GameDashboard } from '../ui/GameDashboard'
import { VictoryScreen } from '../ui/VictoryScreen'
import { reduce, initialGameState } from '../logic/game-reducer'
import type { LeaderboardEntry, PlayerStats } from '../types/game'
import styles from './screens.module.css'

export function GameScreen({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth()
  const [gameState, dispatch] = useReducer(reduce, initialGameState)
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const [session, setSession] = useState<{ id: string; gameKey: number } | null>(null)

  const refreshLeaderboard = () => {
    setLeaderboardLoading(true)
    fetchLeaderboard('classic')
      .then(setLeaderboard)
      .catch(err => console.error('[GameScreen] fetchLeaderboard', err))
      .finally(() => setLeaderboardLoading(false))
  }

  useEffect(() => {
    fetchLeaderboard('classic')
      .then(setLeaderboard)
      .catch(err => console.error('[GameScreen] fetchLeaderboard init', err))
      .finally(() => setLeaderboardLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    fetchPlayerStats(user._id, 'classic')
      .then(setPlayerStats)
      .catch(err => console.error('[GameScreen] fetchPlayerStats', err))
  }, [user])

  useEffect(() => {
    if (!user || !user.token) return
    const gameKey = gameState.gameKey
    startGameSession('classic', user.token)
      .then(({ sessionId }) => setSession({ id: sessionId, gameKey }))
      .catch(err => console.error('[GameScreen] startGameSession', err))
  }, [user, gameState.gameKey])

  useEffect(() => {
    if (!gameState.victory || !user || !user.token) return
    if (!session || session.gameKey !== gameState.gameKey) return
    const victory = gameState.victory
    const currentSession = session
    void (async () => {
      setSavedStatus('saving')
      try {
        await saveGameHistory(user._id, 'classic', victory.totalScore, victory.shots, user.token, currentSession.id)
        setSavedStatus('saved')
        refreshLeaderboard()
        fetchPlayerStats(user._id, 'classic')
          .then(setPlayerStats)
          .catch(err => console.error('[GameScreen] fetchPlayerStats post-save', err))
      } catch (err) {
        setSavedStatus('error')
        console.error('[GameScreen] saveGameHistory', err)
      }
    })()
  }, [gameState.victory, gameState.gameKey, user, session])

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
    <div className={styles.screen}>
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
