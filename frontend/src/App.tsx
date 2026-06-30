import { useReducer } from 'react'
import BilliardsScene from './BilliardsScene'
import { GameHud } from './ui/GameHud'
import { VictoryScreen } from './ui/VictoryScreen'
import { computeShotScore, computeVictoryBonus } from './logic/score'

interface GameState {
  gameKey: number
  score: number
  shots: number
  victory: { totalScore: number; ballScore: number; victoryBonus: number; shots: number } | null
}

type GameAction =
  | { type: 'shot_resolved'; ballsPotted: number; scratch: boolean; isVictory: boolean }
  | { type: 'replay' }

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
  }
}

const initialState: GameState = { gameKey: 0, score: 0, shots: 0, victory: null }

export default function App() {
  const [gameState, dispatch] = useReducer(reduce, initialState)

  const handleShotResolved = (ballsPotted: number, scratch: boolean, isVictory: boolean) => {
    dispatch({ type: 'shot_resolved', ballsPotted, scratch, isVictory })
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
          onReplay={() => dispatch({ type: 'replay' })}
        />
      )}
    </div>
  )
}
