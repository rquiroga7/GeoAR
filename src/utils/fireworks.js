const FIREWORK_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF6348', '#7bed9f', '#70a1ff', '#ffa502']

class Fireworks {
  constructor() {
    this.particles = []
    this.canvas = null
    this.ctx = null
    this.animating = false
  }

  init() {
    if (this.canvas) return
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'fireworks-canvas'
    this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:300;'
    document.body.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')
    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    if (!this.canvas) return
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  createParticle(x, y, color, size, speed) {
    const angle = Math.random() * Math.PI * 2
    const spd = speed || (Math.random() * 4 + 2)
    return {
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1,
      decay: Math.random() * 0.015 + 0.008,
      color,
      size: size || (Math.random() * 3 + 2),
      gravity: 0.06
    }
  }

  createBurst(x, y) {
    const count = 50 + Math.floor(Math.random() * 20)
    for (let i = 0; i < count; i++) {
      const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]
      const size = Math.random() * 4 + 3
      const speed = Math.random() * 5 + 2
      this.particles.push(this.createParticle(x, y, color, size, speed))
    }
    // Add white core particles
    for (let i = 0; i < 8; i++) {
      this.particles.push(this.createParticle(x, y, '#ffffff', 2, Math.random() * 2 + 1))
    }
  }

  burstAt(clientX, clientY) {
    this.init()
    this.createBurst(clientX, clientY)
    if (!this.animating) {
      this.animating = true
      this.animate()
    }
  }

  animate() {
    if (!this.ctx) return
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.vx *= 0.99
      p.life -= p.decay
      
      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }
      
      this.ctx.globalAlpha = p.life
      this.ctx.fillStyle = p.color
      
      // Draw with a subtle glow
      this.ctx.shadowBlur = p.size * 2
      this.ctx.shadowColor = p.color
      
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      this.ctx.fill()
    }
    
    this.ctx.globalAlpha = 1
    this.ctx.shadowBlur = 0
    
    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.animate())
    } else {
      this.animating = false
    }
  }

  launch() {
    this.init()
    const burstCount = 5
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        const x = Math.random() * this.canvas.width * 0.6 + this.canvas.width * 0.2
        const y = Math.random() * this.canvas.height * 0.4 + this.canvas.height * 0.1
        this.createBurst(x, y)
        if (!this.animating) {
          this.animating = true
          this.animate()
        }
      }, i * 300)
    }
  }

  launchLoop(count = 5) {
    this.init()
    let remaining = count
    this.loopInterval = setInterval(() => {
      if (!this.canvas || remaining <= 0) {
        this.stopLoop()
        return
      }
      remaining--
      const x = Math.random() * this.canvas.width * 0.8 + this.canvas.width * 0.1
      const y = Math.random() * this.canvas.height * 0.5 + this.canvas.height * 0.1
      this.createBurst(x, y)
      if (!this.animating) {
        this.animating = true
        this.animate()
      }
    }, 500)
  }

  stopLoop() {
    if (this.loopInterval) {
      clearInterval(this.loopInterval)
      this.loopInterval = null
    }
  }
}

const fireworks = new Fireworks()
export default fireworks
