import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react"
import { useState, useEffect } from "react"

type TimerMode = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK"

export default function Sessions() {
    const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes
    const [isActive, setIsActive] = useState(false)
    const [mode, setMode] = useState<TimerMode>("FOCUS")

    useEffect(() => {
        let interval: number | null = null

        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            setIsActive(false)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isActive, timeLeft])

    const toggleTimer = () => setIsActive(!isActive)

    const resetTimer = () => {
        setIsActive(false)
        if (mode === "FOCUS") setTimeLeft(25 * 60)
        else if (mode === "SHORT_BREAK") setTimeLeft(5 * 60)
        else setTimeLeft(15 * 60)
    }

    const setTimerMode = (newMode: TimerMode) => {
        setMode(newMode)
        setIsActive(false)
        if (newMode === "FOCUS") setTimeLeft(25 * 60)
        else if (newMode === "SHORT_BREAK") setTimeLeft(5 * 60)
        else setTimeLeft(15 * 60)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Focus Sessions</h1>
            </div>

            <div className="flex flex-col items-center space-y-8 py-8">
                <div className="flex bg-muted p-1 rounded-lg">
                    <Button
                        variant={mode === "FOCUS" ? "default" : "ghost"}
                        onClick={() => setTimerMode("FOCUS")}
                        className="gap-2"
                    >
                        <Brain className="w-4 h-4" /> Focus
                    </Button>
                    <Button
                        variant={mode === "SHORT_BREAK" ? "default" : "ghost"}
                        onClick={() => setTimerMode("SHORT_BREAK")}
                        className="gap-2"
                    >
                        <Coffee className="w-4 h-4" /> Short Break
                    </Button>
                    <Button
                        variant={mode === "LONG_BREAK" ? "default" : "ghost"}
                        onClick={() => setTimerMode("LONG_BREAK")}
                    >
                        Long Break
                    </Button>
                </div>

                <div className="relative flex items-center justify-center w-64 h-64 border-4 border-muted rounded-full">
                    <div className="absolute text-6xl font-bold font-mono tracking-widest">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button size="lg" className="w-32" onClick={toggleTimer}>
                        {isActive ? <><Pause className="mr-2 w-4 h-4" /> Pause</> : <><Play className="mr-2 w-4 h-4" /> Start</>}
                    </Button>
                    <Button size="lg" variant="outline" onClick={resetTimer}>
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
