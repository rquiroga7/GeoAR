import { useState, useEffect } from 'react'
import './Menu.css'
import { RANKS } from '../utils/ranks'

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

function Menu({ onSelectMode }) {
  const [stats, setStats] = useState(loadStats)

  useEffect(() => {
    const handler = () => setStats(loadStats())
    window.addEventListener('storage', handler)
    const interval = setInterval(handler, 500)
    return () => { window.removeEventListener('storage', handler); clearInterval(interval) }
  }, [])

  const renderRank = (rankIdx) => {
    if (rankIdx < 0 || rankIdx >= RANKS.length) return '—'
    const rank = RANKS[rankIdx]
    return `${rank.icon} ${rank.name}`
  }

  return (
    <div className="menu">
      <div className="menu-logo">🗺️</div>
      <h1 className="menu-title">GeoAprende Córdoba</h1>
      <p className="menu-subtitle">Aprende los departamentos y cabeceras de la provincia de Córdoba</p>

      <div className="mode-cards">
        <div className="mode-card" onClick={() => onSelectMode('map')}>
          <div className="icon">📍</div>
          <h3>Ubicá el Departamento</h3>
          <p>Se te nombre un departamento y deberás encontrarlo en el mapa.</p>
          <div className="mode-stats">
            <div className="mode-stat">
              <span className="stat-label">Mejor actuación</span>
              <span className="stat-value">{renderRank(stats.map.bestRankIdx)}</span>
            </div>
            <div className="mode-stat">
              <span className="stat-label">Última partida</span>
              <span className="stat-value">
                {stats.map.last > 0 ? `${stats.map.last} pts` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="mode-card" onClick={() => onSelectMode('capital')}>
          <div className="icon">🏙️</div>
          <h3>¿Cuál es la Cabecera?</h3>
          <p>Se te muestra un departamento y deberás elegir su ciudad cabecera.</p>
          <div className="mode-stats">
            <div className="mode-stat">
              <span className="stat-label">Mejor actuación</span>
              <span className="stat-value">{renderRank(stats.capital.bestRankIdx)}</span>
            </div>
            <div className="mode-stat">
              <span className="stat-label">Última partida</span>
              <span className="stat-value">
                {stats.capital.last > 0 ? `${stats.capital.last} pts` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Menu
