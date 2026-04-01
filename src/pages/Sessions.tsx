import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Coffee, Brain, CheckCircle2, PlusCircle } from "lucide-react"
import { useTimer } from "@/contexts/TimerContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { toast } from "sonner"

export default function Sessions() {
    const { 
        timeLeft, 
        isActive, 
        mode, 
        topic, 
        setTopic, 
        toggleTimer, 
        resetTimer, 
        setTimerMode, 
        formatTime,
        tasks,
        selectedTaskId,
        setSelectedTaskId,
        showFeedback,
        setShowFeedback,
        lastSessionTaskId
    } = useTimer()

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
                    <Button size="lg" className="w-32" onClick={toggleTimer}>
                        {isActive ? <><Pause className="mr-2 w-4 h-4" /> Pause</> : <><Play className="mr-2 w-4 h-4" /> Start</>}
                    </Button>
                    <Button size="lg" variant="outline" onClick={resetTimer}>
                        <RotateCcw className="w-4 h-4" />
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

                {/* Session Feedback Dialog */}
                <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-primary" />
                                Session Complete!
                            </DialogTitle>
                            <DialogDescription>
                                You've finished a focus session for <strong>"{currentTask?.title || "your task"}"</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-6 flex flex-col items-center justify-center space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Pomo Progress</p>
                                <div className="text-3xl font-bold text-primary">
                                    {currentTask?.currentPomos || 0} / {currentTask?.totalPomos || 1}
                                </div>
                            </div>
                            
                            {currentTask && (currentTask.currentPomos || 0) >= (currentTask.totalPomos || 1) ? (
                                <div className="bg-green-500/10 text-green-600 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Goal Reached!
                                </div>
                            ) : (
                                <div className="bg-blue-500/10 text-blue-600 px-4 py-2 rounded-full text-xs font-bold">
                                    Keep going! Almost there.
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button 
                                variant="outline" 
                                className="flex-1 gap-2"
                                onClick={() => handleAddPomos(1)}
                            >
                                <PlusCircle className="w-4 h-4" /> +1 Pomo
                            </Button>
                            <Button 
                                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                                onClick={handleCompleteTask}
                            >
                                <CheckCircle2 className="w-4 h-4" /> Strike Off
                            </Button>
                        </DialogFooter>
                        <div className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => setShowFeedback(false)} className="text-muted-foreground text-[10px]">
                                Keep Task Active
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
