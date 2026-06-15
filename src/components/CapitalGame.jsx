import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import departmentsData from '../departments-data.json'
import fireworks from '../utils/fireworks'
import sound from '../utils/sound'
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

function getOptions(correctCapital, allCapitals) {
  const otherCapitals = allCapitals.filter(c => c !== correctCapital)
  const shuffledOthers = shuffleArray(otherCapitals).slice(0, 3)
  return shuffleArray([correctCapital, ...shuffledOthers])
}

function getRoundSize(streak) {
  const idx = Math.min(streak, LEVEL_SIZES.length - 1)
  return LEVEL_SIZES[idx]
}

function CapitalGame({ onBack, onRoundEnd }) {
  const [roundDepts, setRoundDepts] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [options, setOptions] = useState([])
  const [selectedOption, setSelectedOption] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [roundTrophies, setRoundTrophies] = useState(0)
  const [streak, setStreak] = useState(0)
  const [isAnswered, setIsAnswered] = useState(false)
  const [attemptsThisQuestion, setAttemptsThisQuestion] = useState(0)
  const [resultData, setResultData] = useState(null)
  const [scorePopup, setScorePopup] = useState(null)
  const [deptAttempts, setDeptAttempts] = useState({})
  const trophiesRef = useRef(0)
  const streakRef = useRef(0)

  const allCapitals = useMemo(() => departmentsData.map(d => d.capital), [])

  const startNewRound = useCallback((currentStreak) => {
    const size = getRoundSize(currentStreak)
    const selected = shuffleArray(ORDERED_DEPARTMENTS.slice(0, size))
    setRoundDepts(selected)
    setCurrentIndex(0)
    setCorrectCount(0)
    setWrongCount(0)
    setSelectedOption(null)
    setShowResult(false)
    setRoundTrophies(0)
    trophiesRef.current = 0
    setIsAnswered(false)
    setAttemptsThisQuestion(0)
    setResultData(null)
    setScorePopup(null)
    setDeptAttempts({})
  }, [])

  useEffect(() => {
    startNewRound(0)
  }, [startNewRound])

  useEffect(() => {
    if (roundDepts.length > 0 && currentIndex < roundDepts.length && !isAnswered) {
      const currentDept = roundDepts[currentIndex]
      setOptions(getOptions(currentDept.capital, allCapitals))
      setSelectedOption(null)
      setAttemptsThisQuestion(0)
    }
  }, [currentIndex, roundDepts, allCapitals, isAnswered])

  const getPointsForAttempt = (attempt) => {
    if (attempt === 0) return 10
    if (attempt === 1) return 5
    if (attempt === 2) return 2
    return 1
  }

  const handleOptionClick = (capital) => {
    if (isAnswered) return
    
    const currentDept = roundDepts[currentIndex]
    const isCorrect = capital === currentDept.capital
    
    if (isCorrect) {
      sound.playCorrect()
      setIsAnswered(true)
      setSelectedOption(capital)
      setDeptAttempts(prev => ({ ...prev, [currentDept.name]: attemptsThisQuestion }))
      const newCorrect = correctCount + 1
      setCorrectCount(newCorrect)
      
      const points = getPointsForAttempt(attemptsThisQuestion)
      trophiesRef.current += points
      setRoundTrophies(trophiesRef.current)
      
      setScorePopup({ type: 'correct', text: `${currentDept.name} → ${capital}` })
      
      setTimeout(() => {
        setScorePopup(null)
        moveToNext(newCorrect)
      }, 2400)
    } else {
      sound.playWrong()
      setSelectedOption(capital)
      setAttemptsThisQuestion(prev => prev + 1)
      setWrongCount(prev => prev + 1)
      
      setTimeout(() => {
        setSelectedOption(null)
      }, 600)
    }
  }

  const moveToNext = (correct) => {
    if (currentIndex + 1 >= roundDepts.length) {
      finishRound(correct)
    } else {
      setCurrentIndex(prev => prev + 1)
      setIsAnswered(false)
    }
  }

  const finishRound = (correct) => {
    const total = roundDepts.length
    const maxScore = total * 10
    const score = trophiesRef.current
    const currentLevel = streakRef.current + 1

    let levelResult = 'fail'
    if (score >= maxScore * 0.8) {
      levelResult = 'pass'
      streakRef.current = streakRef.current + 1
      fireworks.launchLoop()
      sound.playVictory()
    } else if (score >= maxScore * 0.5) {
      levelResult = 'good'
    }

    setStreak(streakRef.current)
    onRoundEnd('capital', score, maxScore)
    setResultData({ correct, total, maxScore, score, currentLevel, levelResult })
    setShowResult(true)
  }

  const handlePlayAgain = () => {
    fireworks.stopLoop()
    startNewRound(streakRef.current)
  }

  const handleBack = () => {
    fireworks.stopLoop()
    onBack()
  }

  const handleLevelChange = (e) => {
    const newStreak = parseInt(e.target.value, 10)
    fireworks.stopLoop()
    streakRef.current = newStreak
    setStreak(newStreak)
    startNewRound(newStreak)
  }

  const currentDept = roundDepts[currentIndex]
  const progress = roundDepts.length > 0 ? ((currentIndex) / roundDepts.length) * 100 : 0

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
          <div className="capital-game-area">
            <div className="capital-map-col">
              <div className="question-bar" style={{ marginBottom: '12px' }}>
                <h2>¿Cabecera de <span className="highlight">{currentDept.name}</span>?</h2>
              </div>
              <div className="progress-container" style={{ marginBottom: '12px' }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="progress-text">{currentIndex + 1} de {roundDepts.length}</div>
              </div>
              <div className="mini-map-container">
                <svg className="mini-map-svg" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
                  {departmentsData.map((dept) => (
                    <path key={dept.name} d={dept.path}
                      fill={dept.name === currentDept.name ? '#FFD700' : '#3a3a5c'}
                      stroke={dept.name === currentDept.name ? '#FFA500' : '#1a1a2e'}
                      strokeWidth={dept.name === currentDept.name ? 2.5 : 1}
                      strokeLinejoin="round"
                    />
                  ))}
                  <text x={currentDept.cx} y={currentDept.cy}
                    style={{ fontSize: '11px', fill: '#1a1a2e', fontWeight: '900', textAnchor: 'middle', pointerEvents: 'none',
                      paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: '3px', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    {currentDept.name}
                  </text>
                </svg>
              </div>
            </div>
            <div className="capital-options-col">
              {options.map((capital) => {
                let className = 'option-btn'
                if (isAnswered) {
                  if (capital === currentDept.capital) className += ' correct'
                  else if (capital === selectedOption) className += ' wrong'
                  else className += ' disabled'
                } else if (capital === selectedOption) {
                  className += ' wrong'
                }
                return (
                  <button key={capital} className={className} onClick={() => handleOptionClick(capital)} disabled={isAnswered}>
                    {capital}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {scorePopup && <div className={`score-popup ${scorePopup.type}`}>{scorePopup.text}</div>}

        {showResult && resultData && (
          <div className="game-round-area with-results">
            <div className="map-container">
              <svg className="map-svg" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
                {departmentsData.map((dept) => (
                  <path key={dept.name} d={dept.path}
                    fill={
                      deptAttempts[dept.name] !== undefined
                        ? ATTEMPT_COLORS[Math.min(deptAttempts[dept.name], 2)]
                        : '#3a3a5c'
                    }
                    stroke="#1a1a2e"
                    strokeWidth={1}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}
                {departmentsData.filter(d => deptAttempts[d.name] !== undefined).map((dept) => (
                  <text key={`label-${dept.name}`} x={dept.cx} y={dept.cy}
                    style={{ fontSize: '7px', fill: 'white', textAnchor: 'middle', pointerEvents: 'none',
                      paintOrder: 'stroke', stroke: '#1a1a2e', strokeWidth: '2px', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    {dept.name.length > 16 ? dept.name.substring(0, 16) + '…' : dept.name}
                  </text>
                ))}
              </svg>
            </div>
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
                  {resultData.levelResult === 'pass' && (
                    <p className="level-up-text">¡Excelentes respuestas! Pasando a nivel {resultData.currentLevel + 1} de dificultad</p>
                  )}
                  {resultData.levelResult === 'good' && (
                    <p className="level-up-text" style={{ color: '#FFD600' }}>¡Muy bien! Pero podés mejorar, intentá de nuevo</p>
                  )}
                  {resultData.levelResult === 'fail' && (
                    <p className="level-up-text" style={{ color: '#FF6584' }}>No te preocupes, ¡practicando vas a mejorar!</p>
                  )}
                  <p className="score-text">{resultData.correct} de {resultData.total} correctas ({Math.round(resultData.correct / resultData.total * 100)}%)</p>
                  <div className="trophies-earned">🏆 {resultData.score} de {resultData.maxScore} puntos posibles</div>
                  {(() => {
                    const r = getRank(resultData.score, resultData.maxScore)
                    return r ? <p className="rank-text">{r.icon} Rango: {r.name}</p> : null
                  })()}
                  {Object.values(deptAttempts).some(v => v > 0) && (
                    <p className="review-text">Deberías repasar las cabeceras de los departamentos que no están en verde!</p>
                  )}
                  <div className="color-legend">
                    <span><span className="legend-dot" style={{ background: '#00C853' }}></span> Excelente</span>
                    <span><span className="legend-dot" style={{ background: '#FFD600' }}></span> Repasar</span>
                    <span><span className="legend-dot" style={{ background: '#FF9100' }}></span> Estudiar</span>
                  </div>
                  <div className="buttons">
                    <button className="btn" onClick={handlePlayAgain}>
                      {resultData.levelResult === 'pass' ? 'Siguiente nivel' : 'Intentar de nuevo'}
                    </button>
                    <button className="btn btn-secondary" onClick={handleBack}>Volver al menú</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CapitalGame
