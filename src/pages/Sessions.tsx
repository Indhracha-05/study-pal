import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react"
import { useTimer } from "@/contexts/TimerContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

export default function Sessions() {
    const { 
        timeLeft, 
        isActive, 
        mode, 
        toggleTimer, 
        resetTimer, 
        setTimerMode, 
        formatTime,
        tasks,
        selectedTaskId,
        setSelectedTaskId,
        showFeedback,
        setShowFeedback,
        showTransitionFeedback,
        setShowTransitionFeedback,
        lastSessionTaskId
    } = useTimer()

    const navigate = useNavigate()

    const currentTask = tasks.find(t => t.id === lastSessionTaskId)

    const handleCompleteTask = async () => {
        if (!lastSessionTaskId) return
        try {
            await updateDoc(doc(db, "tasks", lastSessionTaskId), { completed: true })
            toast.success("Task completed! Great job.")
            setShowFeedback(false)
        } catch (e) {
            toast.error("Failed to update task")
        }
    }

    const handleAddPomos = async (count: number) => {
        if (!lastSessionTaskId || !currentTask) return
        try {
            const newTotal = (currentTask.totalPomos || 1) + count
            await updateDoc(doc(db, "tasks", lastSessionTaskId), { totalPomos: newTotal })
            toast.success(`Goal updated! Added ${count} more pomos.`)
            setShowFeedback(false)
        } catch (e) {
            toast.error("Failed to update goal")
        }
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
                    <Button 
                        size="lg" 
                        className="w-48 glow-btn font-bold relative group" 
                        onClick={() => {
                            if (mode === "FOCUS" && !selectedTaskId) {
                                toast.warning("Please select a task to focus on first!", {
                                    description: "You can add new tasks in the Calendar page.",
                                    action: {
                                        label: "Go to Calendar",
                                        onClick: () => navigate("/dashboard/calendar")
                                    }
                                });
                                return;
                            }
                            toggleTimer();
                        }}
                    >
                        {isActive ? <><Pause className="mr-3 w-5 h-5 transition-transform group-hover:scale-110" /> PAUSE</> : <><Play className="mr-3 w-5 h-5 transition-transform group-hover:scale-110" /> START FOCUS</>}
                        {mode === "FOCUS" && !selectedTaskId && (
                             <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-destructive/90 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-xl pointer-events-none mb-2">
                                ⚠️ TASK REQUIRED
                             </div>
                        )}
                    </Button>
                    <Button size="lg" variant="outline" className="w-16 h-12 rounded-xl border-white/5 bg-white/5 hover:bg-white/10" onClick={resetTimer}>
                        <RotateCcw className="w-5 h-5" />
                    </Button>
                </div>

                {mode === "FOCUS" && (
                    <div className="w-full max-w-sm space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Link a Task (Optional)</label>
                            <select
                                className="w-full bg-background border rounded-md px-3 py-2 text-sm"
                                value={selectedTaskId}
                                onChange={(e) => setSelectedTaskId(e.target.value)}
                            >
                                <option value="">No task selected</option>
                                {tasks
                                    .filter(t => !t.completed)
                                    .map(task => (
                                        <option key={task.id} value={task.id}>
                                            {task.title} ({task.currentPomos || 0}/{task.totalPomos || 1} ⏲️)
                                        </option>
                                    ))
                                }
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Task goal tracking and feedback enabled.
                            </p>
                        </div>
                    </div>
                )}

                {/* Unified Session Mastery Dialog */}
                <Dialog open={showFeedback || showTransitionFeedback} onOpenChange={(open) => { setShowFeedback(open); setShowTransitionFeedback(open); }}>
                    <DialogContent className="sm:max-w-md glass-card border-primary/20">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-primary" />
                                {showFeedback ? "Goal Reached!" : "Session Complete!"} 🔔
                            </DialogTitle>
                            <DialogDescription>
                                {currentTask ? (
                                    <>Progress logged for <strong>"{currentTask.title}"</strong>.</>
                                ) : (
                                    <>Great job! You finished a focus session.</>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-2 space-y-6">
                            {currentTask && (
                                <div className="flex flex-col items-center bg-primary/5 rounded-2xl py-4 border border-primary/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Current Goal Progress</p>
                                    <div className="text-3xl font-black text-primary">
                                        {currentTask.currentPomos} / {currentTask.totalPomos || 1}
                                    </div>
                                    {showFeedback && (
                                        <div className="mt-3 flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="h-8 text-[10px] uppercase font-bold border-primary/20 hover:bg-primary/10"
                                                onClick={() => handleAddPomos(1)}
                                            >
                                                +1 Pomo
                                            </Button>
                                            <Button 
                                                size="sm"
                                                className="h-8 text-[10px] uppercase font-bold bg-green-600 hover:bg-green-700"
                                                onClick={handleCompleteTask}
                                            >
                                                Strike Off ✅
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center text-muted-foreground">Select Next Phase</p>
                                <div className="grid grid-cols-1 gap-2">
                                    <Button 
                                        className="w-full rounded-xl h-14 glow-btn font-bold flex justify-between px-6 border-none"
                                        onClick={() => {
                                            setTimerMode("FOCUS");
                                            setShowFeedback(false);
                                            setShowTransitionFeedback(false);
                                            toast.success("Locked in! Starting next Focus session.");
                                            toggleTimer();
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Brain className="w-5 h-5" />
                                            <span className="text-sm">Continue Focus</span>
                                        </div>
                                        <span className="text-[10px] opacity-70">25:00</span>
                                    </Button>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button 
                                            variant="outline"
                                            className="rounded-xl h-14 flex flex-col items-center justify-center gap-1 hover:bg-green-500/10 hover:text-green-500 border-white/5"
                                            onClick={() => {
                                                setTimerMode("SHORT_BREAK");
                                                setShowFeedback(false);
                                                setShowTransitionFeedback(false);
                                                toast.success("Time for a quick recharge!");
                                                toggleTimer();
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Coffee className="w-4 h-4" />
                                                <span className="text-xs font-bold">Short Break</span>
                                            </div>
                                            <span className="text-[9px] opacity-60 font-mono">05:00</span>
                                        </Button>

                                        <Button 
                                            variant="outline"
                                            className="rounded-xl h-14 flex flex-col items-center justify-center gap-1 hover:bg-blue-500/10 hover:text-blue-500 border-white/5"
                                            onClick={() => {
                                                setTimerMode("LONG_BREAK");
                                                setShowFeedback(false);
                                                setShowTransitionFeedback(false);
                                                toast.success("Desktop reset time!");
                                                toggleTimer();
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <RotateCcw className="w-4 h-4" />
                                                <span className="text-xs font-bold">Long Break</span>
                                            </div>
                                            <span className="text-[9px] opacity-60 font-mono">15:00</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-center">
                            <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedTaskId("");
                                setShowFeedback(false);
                                setShowTransitionFeedback(false);
                            }} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:text-destructive hover:bg-transparent">
                                Switch Task 🔄
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
