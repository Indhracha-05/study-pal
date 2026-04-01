import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Plus, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function Calendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [tasks, setTasks] = useState<any[]>([])
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
    const [newTask, setNewTask] = useState({ title: "", deadline: format(new Date(), "yyyy-MM-dd"), priority: "medium", totalPomos: 1 })
    const { currentUser } = useAuth()

    useEffect(() => {
        if (!currentUser) return

        const q = query(
            collection(db, "tasks"),
            where("userId", "==", currentUser.uid)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setTasks(fetchedTasks)
        })

        return () => unsubscribe()
    }, [currentUser])

    const handleAddTask = async () => {
        if (!newTask.title.trim() || !currentUser) return
        try {
            await addDoc(collection(db, "tasks"), {
                userId: currentUser.uid,
                title: newTask.title.trim(),
                deadline: newTask.deadline,
                priority: newTask.priority,
                totalPomos: Number(newTask.totalPomos),
                currentPomos: 0,
                completed: false,
                createdAt: serverTimestamp()
            })
            setNewTask({ title: "", deadline: format(new Date(), "yyyy-MM-dd"), priority: "medium", totalPomos: 1 })
            setIsAddTaskOpen(false)
            toast.success("Task added to your calendar!")
        } catch (err) {
            toast.error("Failed to add task")
        }
    }

    const openAddTaskOnDate = (day: Date) => {
        setNewTask({ ...newTask, deadline: format(day, "yyyy-MM-dd") })
        setIsAddTaskOpen(true)
    }

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    })

    const getTasksForDay = (day: Date) => {
        return tasks.filter(task => {
            if (!task.deadline) return false
            const deadline = new Date(task.deadline)
            return isSameDay(deadline, day)
        }).sort((a, b) => {
            const pMap: any = { high: 0, medium: 1, low: 2 }
            const diff = (pMap[a.priority] || 1) - (pMap[b.priority] || 1)
            if (diff !== 0) return diff
            // Tie-break: earlier deadline first (though they are on the same day, could sort by title or created time)
            return a.title.localeCompare(b.title)
        })
    }

    // Sort priority stack: Priority FIRST, then earlier Deadline
    const sortedActiveTasks = tasks
        .filter(t => !t.completed && t.deadline)
        .sort((a, b) => {
            const pMap: any = { high: 0, medium: 1, low: 2 }
            const pDiff = (pMap[a.priority] || 1) - (pMap[b.priority] || 1)
            
            if (pDiff !== 0) return pDiff // If priorities are different, use that
            
            // If priorities are SAME, use earlier deadline
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Academic Calendar</h1>
                    <p className="text-muted-foreground">Click any date to add a study task with a deadline.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-muted rounded-lg p-1 mr-4">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold px-4 min-w-[120px] text-center">
                            {format(currentMonth, "MMM yyyy")}
                        </span>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Task</DialogTitle>
                                <DialogDescription>Keep track of your deadlines and study priorities.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Task Name</label>
                                    <Input 
                                        placeholder="e.g. Calculus Midterm Study" 
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Deadline</label>
                                        <Input 
                                            type="date"
                                            value={newTask.deadline}
                                            onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Number of Pomos ⏲️</label>
                                        <Input 
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={newTask.totalPomos}
                                            onChange={(e) => setNewTask({...newTask, totalPomos: parseInt(e.target.value) || 1})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Priority 🚩</label>
                                        <select 
                                            className="w-full bg-background border rounded-md px-3 py-2 text-sm"
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                                        >
                                            <option value="high">High 🔥</option>
                                            <option value="medium">Medium ⚡</option>
                                            <option value="low">Low 💤</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddTask}>Add to Calendar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-card overflow-hidden">
                <CardContent className="p-0">
                    <div className="grid grid-cols-7 bg-muted/50 border-b">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {calendarDays.map((day) => {
                            const dayTasks = getTasksForDay(day)
                            const isCurrentMonth = isSameDay(startOfMonth(day), monthStart)
                            
                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => openAddTaskOnDate(day)}
                                    className={`min-h-[120px] p-2 border-r border-b last:border-r-0 relative group transition-all hover:bg-primary/5 cursor-pointer ${
                                        !isCurrentMonth ? "bg-muted/10 opacity-30" : ""
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full transition-colors group-hover:bg-primary group-hover:text-primary-foreground ${
                                            isToday(day) ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                                        }`}>
                                            {format(day, "d")}
                                        </span>
                                        <Plus className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none pointer-events-none">
                                        {dayTasks.map(task => (
                                            <div
                                                key={task.id}
                                                className={`text-[9.5px] p-1.5 rounded-md border flex items-center gap-1.5 shadow-sm ${
                                                    task.completed 
                                                        ? "bg-muted/50 text-muted-foreground line-through" 
                                                        : task.priority === "high"
                                                            ? "bg-red-500/10 text-red-600 border-red-500/20 font-bold"
                                                            : task.priority === "medium"
                                                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold"
                                                                : "bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold"
                                                }`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                    task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
                                                }`} />
                                                <span className="truncate flex-1">{task.title}</span>
                                                <span className="text-[8px] opacity-70">
                                                    {task.currentPomos || 0}/{task.totalPomos || 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="border-none shadow-lg bg-background/50 backdrop-blur-sm lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Next Deadlines
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            {sortedActiveTasks
                                .slice(0, 4)
                                .map(task => (
                                    <div key={task.id} className="flex flex-col p-4 border rounded-xl bg-card/50 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                task.priority === "high" ? "bg-red-100 text-red-700" : task.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                            }`}>
                                                {task.priority || "Normal"}
                                            </span>
                                            <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                        <p className="font-bold text-sm mb-1">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(task.deadline), "EEEE, MMM do")}
                                        </p>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-background/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            Smart priority Stack
                        </CardTitle>
                        <CardDescription>Priority first, then earlier deadline tie-breaker.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {sortedActiveTasks
                                .slice(0, 5)
                                .map((task, i) => (
                                    <div key={task.id} className="flex items-center gap-3 group">
                                        <span className="text-lg font-bold text-muted-foreground/20 group-hover:text-primary/40 transition-colors">0{i+1}</span>
                                        <div className={`flex-1 p-3 border-l-2 rounded-r transition-all hover:translate-x-1 ${
                                            task.priority === 'high' ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20' : 'border-primary bg-primary/5'
                                        }`}>
                                            <p className="text-sm font-bold">{task.title}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                Due {task.deadline ? format(new Date(task.deadline), "MMM d") : "No date"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
