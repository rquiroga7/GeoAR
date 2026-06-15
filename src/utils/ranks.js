export const RANKS = [
  { name: 'Bronce I', icon: '🥉', color: '#CD7F32' },
  { name: 'Bronce II', icon: '🥉', color: '#CD7F32' },
  { name: 'Bronce III', icon: '🥉', color: '#CD7F32' },
  { name: 'Plata I', icon: '🥈', color: '#C0C0C0' },
  { name: 'Plata II', icon: '🥈', color: '#C0C0C0' },
  { name: 'Plata III', icon: '🥈', color: '#C0C0C0' },
  { name: 'Oro I', icon: '🥇', color: '#FFD700' },
  { name: 'Oro II', icon: '🥇', color: '#FFD700' },
  { name: 'Oro III', icon: '🥇', color: '#FFD700' },
  { name: 'Diamante I', icon: '🔷', color: '#448AFF' },
  { name: 'Diamante II', icon: '🔷', color: '#448AFF' },
  { name: 'Campeón I', icon: '🏆', color: '#FF6F00' },
  { name: 'Campeón II', icon: '🏆', color: '#FF6F00' },
  { name: 'Gran Campeón I', icon: '👑', color: '#D500F9' },
  { name: 'Gran Campeón II', icon: '👑', color: '#D500F9' },
  { name: 'Leyenda Supersónica', icon: '🌟', color: '#FF6D00' },
]

const LEVEL_BASE = { 4: 0, 8: 3, 12: 6, 16: 9, 20: 11, 26: 13 }

export function getRankIndex(score, maxScore) {
  if (maxScore <= 0) return -1
  const deptCount = maxScore / 10
  const levelBase = LEVEL_BASE[deptCount]
  if (levelBase === undefined) return -1
  const pct = score / maxScore
  if (pct >= 0.85) return levelBase + 2
  if (pct >= 0.5) return levelBase + 1
  return levelBase
}

export function getRank(score, maxScore) {
  const idx = getRankIndex(score, maxScore)
  return idx >= 0 ? RANKS[idx] : null
}
