import { useEffect, useRef } from "react"

export default function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let particles: Particle[] = []
        let animationFrameId: number = 0

        let mouse = {
            x: -1000,
            y: -1000,
            radius: 180
        }

        class Particle {
            x: number
            y: number
            directionX: number
            directionY: number
            size: number
            color: string

            char: string
            opacity: number
            weight: number

            constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
                const chars = ['Σ', 'θ', 'π', 'Ω', 'α', 'β', 'γ', 'A', 'B', 'C', '1', '2', '∫', '√', '∞', 'ϕ', 'ψ', 'λ', '∆']
                this.x = x
                this.y = y
                this.directionX = directionX
                this.directionY = directionY
                this.size = size * 10 // Larger for text
                this.color = color
                this.char = chars[Math.floor(Math.random() * chars.length)]
                this.opacity = Math.random() * 0.3 + 0.1
                this.weight = [300, 400, 600, 800][Math.floor(Math.random() * 4)]
            }

            draw() {
                if (!ctx) return
                ctx.save()
                ctx.globalAlpha = this.opacity
                ctx.font = `${this.weight} ${this.size}px 'Outfit', sans-serif`
                ctx.fillStyle = this.color
                ctx.fillText(this.char, this.x, this.y)
                ctx.restore()
            }

            update() {
                if (!canvas) return
                if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX
                if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY

                const dx = mouse.x - this.x
                const dy = mouse.y - this.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius
                    this.directionX -= (dx / distance) * force * 0.1 // Subtle reaction
                    this.directionY -= (dy / distance) * force * 0.1
                    this.opacity = Math.min(1, this.opacity + 0.05) // Brighten on hover
                } else {
                    this.opacity = Math.max(0.1, this.opacity - 0.01)
                }

                this.x += this.directionX
                this.y += this.directionY

                this.draw()
            }
        }

        const isDark = () => document.documentElement.classList.contains('dark')

        const init = () => {
            particles = []
            if (!canvas) return
            const numberOfParticles = (canvas.height * canvas.width) / 15000
            
            for (let i = 0; i < numberOfParticles; i++) {
                const size = (Math.random() * 1.5) + 1.2
                let x = Math.random() * canvas.width
                let y = Math.random() * canvas.height
                
                const isCenter = 
                    x > canvas.width * 0.3 && 
                    x < canvas.width * 0.7 && 
                    y > canvas.height * 0.3 && 
                    y < canvas.height * 0.7

                if (isCenter) {
                    if (Math.random() > 0.5) {
                        x = Math.random() > 0.5 ? Math.random() * (canvas.width * 0.25) : canvas.width * 0.75 + Math.random() * (canvas.width * 0.25)
                    } else {
                        y = Math.random() > 0.5 ? Math.random() * (canvas.height * 0.25) : canvas.height * 0.75 + Math.random() * (canvas.height * 0.25)
                    }
                }

                const directionX = (Math.random() * 0.4) - 0.2
                const directionY = (Math.random() * 0.4) - 0.2
                const color = isDark() ? 'rgba(96, 165, 250, 0.4)' : 'rgba(37, 99, 235, 0.4)'

                particles.push(new Particle(x, y, directionX, directionY, size, color))
            }
        }

        const connect = () => {
            if (!ctx) return
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x
                    const dy = particles[a].y - particles[b].y
                    const distance = dx * dx + dy * dy
                    
                    if (distance < 20000) { 
                        const opacity = 1 - (distance / 20000)
                        ctx.strokeStyle = isDark() ? `rgba(255, 255, 255, ${opacity * 0.05})` : `rgba(0, 0, 0, ${opacity * 0.03})`
                        ctx.lineWidth = 0.5
                        ctx.beginPath()
                        ctx.moveTo(particles[a].x, particles[a].y - particles[a].size / 3)
                        ctx.lineTo(particles[b].x, particles[b].y - particles[b].size / 3)
                        ctx.stroke()
                    }
                }
            }
        }

        const animate = () => {
            if (!canvas || !ctx) return
            animationFrameId = requestAnimationFrame(animate)
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            for (let i = 0; i < particles.length; i++) {
                particles[i].update()
            }
            connect()
        }

        const resizeHandler = () => {
            if (!canvas) return
            canvas.width = innerWidth
            canvas.height = Math.max(innerHeight, 800)
            init()
        }

        const observer = new MutationObserver(() => {
            init()
        })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

        window.addEventListener('resize', resizeHandler)
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x
            mouse.y = e.y
        })
        window.addEventListener('mouseout', () => {
            mouse.x = -1000
            mouse.y = -1000
        })

        canvas.width = innerWidth
        canvas.height = Math.max(innerHeight, 800)
        init()
        animate()

        return () => {
            window.removeEventListener('resize', resizeHandler)
            cancelAnimationFrame(animationFrameId)
            observer.disconnect()
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none opacity-100"
        />
    )
}
