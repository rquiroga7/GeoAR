import { useState, useCallback } from 'react'
import './App.css'
import Menu from './components/Menu'
import MapGame from './components/MapGame'
import CapitalGame from './components/CapitalGame'
import { getRankIndex } from './utils/ranks'

const STATS_KEY = 'geoAprende_cordoba_stats'

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    map: { best: 0, last: 0, maxPossible: 0, lastMax: 0, bestRankIdx: -1 },
    capital: { best: 0, last: 0, maxPossible: 0, lastMax: 0, bestRankIdx: -1 }
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch {}
}

function saveRoundStats(mode, trophies, maxPossible) {
  const stats = loadStats()
  const key = mode
  stats[key].last = trophies
  stats[key].lastMax = maxPossible
  const rankIdx = getRankIndex(trophies, maxPossible)
  if (rankIdx > (stats[key].bestRankIdx ?? -1)) {
    stats[key].bestRankIdx = rankIdx
  }
  if (trophies > stats[key].best) {
    stats[key].best = trophies
    stats[key].maxPossible = maxPossible
  }
  saveStats(stats)
}

function App() {
  const [gameMode, setGameMode] = useState(null)

  const handleSelectMode = (mode) => {
    setGameMode(mode)
  }

  const handleBackToMenu = () => {
    setGameMode(null)
  }

  const handleRoundEnd = useCallback((mode, trophies, maxPossible) => {
    saveRoundStats(mode, trophies, maxPossible)
  }, [])

  return (
    <div className="app">
      {!gameMode && (
        <Menu onSelectMode={handleSelectMode} />
      )}
      {gameMode === 'map' && (
        <MapGame
          onBack={handleBackToMenu}
          onRoundEnd={handleRoundEnd}
        />
      )}
      {gameMode === 'capital' && (
        <CapitalGame
          onBack={handleBackToMenu}
          onRoundEnd={handleRoundEnd}
        />
      )}
    </div>
  )
}

export default App
