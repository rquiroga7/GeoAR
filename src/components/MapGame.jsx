import { useState, useEffect, useCallback, useRef } from 'react'
import departmentsData from '../departments-data.json'
import sound from '../utils/sound'
import fireworks from '../utils/fireworks'
import { getRank } from '../utils/ranks'

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const ATTEMPT_COLORS = ['#00C853', '#FFD600', '#FF9100']

const LEVEL_SIZES = [4, 8, 12, 16, 20, 26]
const LEVEL_ICONS = ['🌱', '🌿', '🌳', '🏔️', '🎓', '👑']

const LEVEL_DEPT_ORDER = [
  'Sobremonte', 'Río Seco', 'Tulumba', 'Ischilín',
  'Totoral', 'Cruz del Eje', 'Río Primero', 'Minas',
  'Punilla', 'Colón', 'San Justo', 'Pocho',
  'San Alberto', 'San Javier', 'Capital', 'Santa María',
  'Río Segundo', 'Calamuchita', 'Tercero Arriba', 'General San Martín',
  'Unión', 'Marcos Juárez', 'Presidente Roque Sáenz Peña', 'Juárez Celman',
  'General Roca', 'Río Cuarto'
]

const ORDERED_DEPARTMENTS = LEVEL_DEPT_ORDER.map(
  name => departmentsData.find(d => d.name === name)
).filter(Boolean)

function getRoundSize(streak) {
  const idx = Math.min(streak, LEVEL_SIZES.length - 1)
  return LEVEL_SIZES[idx]
}

function MapGame({ onBack, onRoundEnd }) {
  const [roundDepts, setRoundDepts] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [departmentStates, setDepartmentStates] = useState({})
  const [revealedNames, setRevealedNames] = useState({})
  const [deptAttempts, setDeptAttempts] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [roundTrophies, setRoundTrophies] = useState(0)
  const [streak, setStreak] = useState(0)
  const [scorePopup, setScorePopup] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [attemptsThisQuestion, setAttemptsThisQuestion] = useState(0)
  const [resultData, setResultData] = useState(null)
  const trophiesRef = useRef(0)
  const streakRef = useRef(0)
  const previousStreakRef = useRef(0)
  const mapRef = useRef(null)

  const startNewRound = useCallback((currentStreak) => {
    const size = getRoundSize(currentStreak)
    const selected = shuffleArray(ORDERED_DEPARTMENTS.slice(0, size))
    setRoundDepts(selected)
    setCurrentIndex(0)
    setCorrectCount(0)
    setWrongCount(0)
    setDepartmentStates({})
    setRevealedNames({})
    setDeptAttempts({})
    setShowResult(false)
    setRoundTrophies(0)
    trophiesRef.current = 0
    setIsTransitioning(false)
    setAttemptsThisQuestion(0)
    setResultData(null)
  }, [])

  useEffect(() => {
    startNewRound(0)
  }, [startNewRound])

  const getPointsForAttempt = (attempt) => {
    if (attempt === 0) return 10
    if (attempt === 1) return 5
    if (attempt === 2) return 2
    return 1
  }

  const spawnFireworks = (cx, cy) => {
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect()
      const screenX = rect.left + (cx / 500) * rect.width
      const screenY = rect.top + (cy / 700) * rect.height
      fireworks.burstAt(screenX, screenY)
    }
  }

  const handleDepartmentClick = (deptName) => {
    if (isTransitioning) return
    if (deptAttempts[deptName] !== undefined) return
    
    const currentDept = roundDepts[currentIndex]
    if (!currentDept) return
    
    if (deptName === currentDept.name) {
      sound.playCorrect()
      setDeptAttempts(prev => ({ ...prev, [deptName]: attemptsThisQuestion }))
      setRevealedNames(prev => ({ ...prev, [deptName]: true }))
      
      const deptData = departmentsData.find(d => d.name === deptName)
      if (deptData) spawnFireworks(deptData.cx, deptData.cy)
      
      const newCorrect = correctCount + 1
      setCorrectCount(newCorrect)
      
      const points = getPointsForAttempt(attemptsThisQuestion)
      trophiesRef.current += points
      setRoundTrophies(trophiesRef.current)
      
      setScorePopup({ type: 'correct', text: deptName })
      
      setTimeout(() => {
        setScorePopup(null)
        moveToNext(newCorrect, wrongCount)
      }, 1100)
    } else {
      sound.playWrong()
      setDepartmentStates(prev => ({ ...prev, [deptName]: 'wrong' }))
      setWrongCount(prev => prev + 1)
      setAttemptsThisQuestion(prev => prev + 1)
      setScorePopup({ type: 'wrong', text: '¡Incorrecto!' })
      
      setTimeout(() => {
        setScorePopup(null)
        setDepartmentStates(prev => {
          const next = { ...prev }
          delete next[deptName]
          return next
        })
      }, 600)
    }
  }

  const moveToNext = (correct, wrong) => {
    if (currentIndex + 1 >= roundDepts.length) {
      finishRound(correct)
    } else {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setAttemptsThisQuestion(0)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const finishRound = (correct) => {
    const total = roundDepts.length
    const maxScore = total * 10
    const score = trophiesRef.current
    const currentLevel = streakRef.current + 1
    const maxLevelIdx = LEVEL_SIZES.length - 1
    const isMaxLevel = streakRef.current >= maxLevelIdx

    previousStreakRef.current = streakRef.current

    let levelResult = 'fail'
    if (score >= maxScore * 0.8) {
      levelResult = 'pass'
      if (!isMaxLevel) {
        streakRef.current = streakRef.current + 1
      }
      fireworks.launchLoop()
      sound.playVictory()
    } else if (score >= maxScore * 0.5) {
      levelResult = 'good'
    }

    setStreak(streakRef.current)
    onRoundEnd('map', score, maxScore)
    setResultData({ correct, total, maxScore, score, currentLevel, levelResult, isMaxLevel })
    setShowResult(true)
  }

  const handlePlayAgain = () => {
    fireworks.stopLoop()
    startNewRound(streakRef.current)
  }

  const handleRepeatLevel = () => {
    fireworks.stopLoop()
    startNewRound(previousStreakRef.current)
  }

  const handleBack = () => {
    fireworks.stopLoop()
    onBack()
  }

  const currentDept = roundDepts[currentIndex]
  const progress = roundDepts.length > 0 ? ((currentIndex) / roundDepts.length) * 100 : 0

  const handleLevelChange = (e) => {
    const newStreak = parseInt(e.target.value, 10)
    fireworks.stopLoop()
    streakRef.current = newStreak
    setStreak(newStreak)
    startNewRound(newStreak)
  }

  return (
    <div className="game-container">
      <header className="game-header">
        <button className="back-btn" onClick={handleBack}>← Menú</button>
        <div className="game-info">
          <select className="level-select" value={streakRef.current} onChange={handleLevelChange}>
            {LEVEL_SIZES.map((size, i) => (
              <option key={i} value={i}>{LEVEL_ICONS[i]} Nivel {i+1} ({size} deptos)</option>
            ))}
          </select>
          <div className="round-badge">🎯 {roundDepts.length} deptos</div>
          <div className="game-stat">
            <span className="label">Pregunta</span>
            <span className="value">{currentIndex + (showResult ? roundDepts.length : 1)}/{roundDepts.length}</span>
          </div>
          <div className="game-stat">
            <span className="label">Correctas</span>
            <span className="value correct">{correctCount}</span>
          </div>
          <div className="game-stat">
            <span className="label">Incorrectas</span>
            <span className="value wrong">{wrongCount}</span>
          </div>
          <div className="trophies-earned">🏆 {roundTrophies}</div>
        </div>
      </header>

      <div className="game-content">
        {!showResult && currentDept && (
          <>
            <div className="question-bar">
              <h2>Hacé click en: <span className="highlight">{currentDept.name}</span></h2>
            </div>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-text">{currentIndex + 1} de {roundDepts.length} departamentos</div>
            </div>
          </>
        )}
        <div className={`game-round-area ${showResult ? 'with-results' : ''}`}>
          <div className="map-container">
            <svg ref={mapRef} className="map-svg" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
              {departmentsData.map((dept) => (
                <path
                  key={dept.name}
                  d={dept.path}
                  fill={
                    deptAttempts[dept.name] !== undefined
                      ? ATTEMPT_COLORS[Math.min(deptAttempts[dept.name], 2)]
                      : departmentStates[dept.name] === 'wrong' ? '#FF1744' :
                      '#3a3a5c'
                  }
                  onClick={() => handleDepartmentClick(dept.name)}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}
              {departmentsData.filter(d => revealedNames[d.name]).map((dept) => (
                <text key={`label-${dept.name}`} x={dept.cx} y={dept.cy} className="dept-label" style={{ fontSize: '7px' }}>
                  {dept.name.length > 16 ? dept.name.substring(0, 16) + '…' : dept.name}
                </text>
              ))}
            </svg>
          </div>

          {showResult && resultData && (
            <div className="result-panel-wrapper">
              <div className="result-panel">
                <div className="round-results">
                  <div className="result-icon">
                    {resultData.levelResult === 'pass' ? '🎉' : resultData.levelResult === 'good' ? '😊' : '😅'}
                  </div>
                  <h2>
                    {resultData.levelResult === 'pass' && '¡Felicitaciones!'}
                    {resultData.levelResult === 'good' && '¡Bien hecho!'}
                    {resultData.levelResult === 'fail' && '¡Seguí intentando!'}
                  </h2>
                  {resultData.levelResult === 'pass' && !resultData.isMaxLevel && (
                    <p className="level-up-text">¡Excelentes respuestas! Pasando a nivel {resultData.currentLevel + 1} de dificultad</p>
                  )}
                  {resultData.levelResult === 'pass' && resultData.isMaxLevel && (() => {
                    const rank = getRank(resultData.score, resultData.maxScore)
                    const isLegend = rank?.name === 'Leyenda Supersónica'
                    return isLegend ? (
                      <p className="level-up-text" style={{ color: '#FFD700', fontSize: '1.2rem' }}>🌟 ¡Leyenda Supersónica! 🌟 Completaste todos los departamentos con una puntuación perfecta. ¡Sos un verdadero maestro de la geografía cordobesa!</p>
                    ) : (
                      <p className="level-up-text" style={{ color: '#6C63FF' }}>¡Completaste todos los niveles! Sos un verdadero experto en los departamentos de Córdoba.</p>
                    )
                  })()}
                  {resultData.levelResult === 'good' && (
                    <p className="level-up-text" style={{ color: '#FFD600' }}>¡Muy bien! Pero podés mejorar, intentá de nuevo</p>
                  )}
                  {resultData.levelResult === 'fail' && (
                    <p className="level-up-text" style={{ color: '#FF6584' }}>No te preocupes, ¡practicando vas a mejorar!</p>
                  )}
                  <p className="score-text">{Object.values(deptAttempts).filter(v => v === 0).length} de {resultData.total} correctas en el primer intento</p>
                  <div className="trophies-earned">🏆 {resultData.score} de {resultData.maxScore} puntos posibles</div>
                  {(() => {
                    const r = getRank(resultData.score, resultData.maxScore)
                    return r ? <p className="rank-text">{r.icon} Rango: {r.name}</p> : null
                  })()}
                  {Object.values(deptAttempts).some(v => v > 0) && (
                    <p className="review-text">Deberías repasar los departamentos que no están en verde!</p>
                  )}
                  <div className="color-legend">
                    <span><span className="legend-dot" style={{ background: '#00C853' }}></span> Excelente</span>
                    <span><span className="legend-dot" style={{ background: '#FFD600' }}></span> Repasar</span>
                    <span><span className="legend-dot" style={{ background: '#FF9100' }}></span> Estudiar</span>
                  </div>
                  <div className="buttons">
                    <button className="btn btn-secondary" onClick={handleBack}>Salir al menú</button>
                    <button className="btn" onClick={handleRepeatLevel}>Repetir nivel</button>
                    {resultData.levelResult === 'pass' && !resultData.isMaxLevel && (
                      <button className="btn" onClick={handlePlayAgain}>Siguiente nivel</button>
                    )}
                  </div>
              </div>
            </div>
            </div>
          )}
        </div>

        {scorePopup && <div className={`score-popup ${scorePopup.type}`}>{scorePopup.text}</div>}
      </div>
    </div>
  )
}

export default MapGame
