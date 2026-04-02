import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Timer, Trophy, Flame, Plus, Trash2, CheckCircle2, Circle } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, collection, query, where, deleteDoc, updateDoc, setDoc } from "firebase/firestore"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalStudyTime: "0h 0m",
        currentStreak: "0 Days",
        rank: "Newbie",
    })
    const [activeGroupsCount, setActiveGroupsCount] = useState(0)
    const [recentSessions, setRecentSessions] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])
    const [userRank, setUserRank] = useState<number | null>(null)
    const [userName, setUserName] = useState<string>("")
    const [sortBy, setSortBy] = useState<"precedence" | "deadline">("precedence")
    const { currentUser } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!currentUser) return;

        // Listen to user stats
        const userDocRef = doc(db, "users", currentUser.uid)
        const unsubscribeSnapshot = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                setStats({
                    totalStudyTime: data.totalStudyTime || "0h 0m",
                    currentStreak: data.currentStreak || "0 Days",
                    rank: data.rank || "Newbie",
                })
                setUserName(data.firstName || "")
            } else {
                setStats({
                    totalStudyTime: "0h 0m",
                    currentStreak: "0 Days",
                    rank: "Newbie",
                })
                try {
                    await setDoc(userDocRef, {
                        totalStudyTime: "0h 0m",
                        currentStreak: "0 Days",
                        rank: "Newbie",
                        email: currentUser.email
                    }, { merge: true })
                } catch (e) {
                    console.error("Could not initialize user document:", e)
                }
            }
        }, (error) => {
            console.error("User stats snapshot error:", error)
        })

        // Listen to recent sessions
        const sessionsQuery = query(
            collection(db, "sessions"),
            where("userId", "==", currentUser.uid)
        )
        const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
            const sessions: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            setRecentSessions(sessions.slice(0, 5))
        }, (error) => {
            console.error("Sessions snapshot error:", error)
        })

        // Listen to tasks
        const tasksQuery = query(
            collection(db, "tasks"),
            where("userId", "==", currentUser.uid)
        )
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setTasks(fetchedTasks)
        }, (error) => {
            console.error("Tasks snapshot error:", error)
        })

        // Listen to active groups count
        const groupsQuery = collection(db, "groups")
        const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
            setActiveGroupsCount(snapshot.size)
        }, (error) => {
            console.error("Groups count error:", error)
        })

        // Listen to all users for rank
        const usersQuery = collection(db, "users")
        const unsubscribeRank = onSnapshot(usersQuery, (snapshot) => {
            const allUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                timeMinutes: timeStringToMinutes(doc.data().totalStudyTime)
            }))
            allUsers.sort((a, b) => b.timeMinutes - a.timeMinutes)
            const currentRank = allUsers.findIndex(u => u.id === currentUser.uid) + 1
            setUserRank(currentRank || 1)
        }, (error) => {
            console.error("Rank calculation error:", error)
        })

        return () => {
            unsubscribeSnapshot()
            unsubscribeSessions()
            unsubscribeTasks()
            unsubscribeGroups()
            unsubscribeRank()
        }
    }, [currentUser])

    const timeStringToMinutes = (timeStr: string) => {
        if (!timeStr) return 0;
        const match = timeStr.match(/(\d+)h\s*(\d+)m/);
        if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
        return 0;
    }

    const handleAddTaskRedirect = () => {
        navigate("/dashboard/calendar")
    }

    const handleToggleTask = async (taskId: string, completed: boolean) => {
        try {
            await updateDoc(doc(db, "tasks", taskId), { completed: !completed })
        } catch (err) {
            toast.error("Failed to update task")
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        try {
            await deleteDoc(doc(db, "tasks", taskId))
        } catch (err) {
            toast.error("Failed to delete task")
        }
    }
    const handleClearCompleted = async () => {
        const completedTasks = tasks.filter(t => t.completed)
        if (completedTasks.length === 0) return

        try {
            const promises = completedTasks.map(t => deleteDoc(doc(db, "tasks", t.id)))
            await Promise.all(promises)
            toast.success(`Cleared ${completedTasks.length} completed task${completedTasks.length > 1 ? 's' : ''}`)
        } catch (err) {
            toast.error("Failed to clear completed tasks")
        }
    }

    const sortedTasks = [...tasks].sort((a, b) => {
        // Done tasks always at bottom
        if (a.completed && !b.completed) return 1
        if (!a.completed && b.completed) return -1

        if (sortBy === "deadline") {
            // Date focus: Date first, then Priority
            if (a.deadline !== b.deadline) {
                if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
                return a.deadline ? -1 : 1
            }
            const pMap: any = { high: 0, medium: 1, low: 2 }
            return (pMap[(a.priority || 'medium').toLowerCase()] ?? 1) - (pMap[(b.priority || 'medium').toLowerCase()] ?? 1)
        } else {
            // Precedence focus: Priority first, then Date
            const pMap: any = { high: 0, medium: 1, low: 2 }
            const aPrio = pMap[(a.priority || 'medium').toLowerCase()] ?? 1
            const bPrio = pMap[(b.priority || 'medium').toLowerCase()] ?? 1
            
            if (aPrio !== bPrio) return aPrio - bPrio
            
            if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
            if (a.deadline || b.deadline) return a.deadline ? -1 : 1
        }

        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
        return aTime - bTime
    })

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight font-heading gradient-text">Command Center</h1>
                    <p className="text-muted-foreground text-sm font-medium tracking-wide">
                        Welcome back{userName ? `, ${userName}` : ""}—your dashboard is ready.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card overflow-hidden shimmer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Study Time</CardTitle>
                        <Timer className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.totalStudyTime}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card overflow-hidden shimmer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Streak</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.currentStreak}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card overflow-hidden shimmer border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">Global Rank</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-primary">#{userRank ?? "..."}</div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 opacity-70">{stats.rank}</p>
                    </CardContent>
                </Card>
                <Card className="glass-card overflow-hidden shimmer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Groups</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{activeGroupsCount}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 glass-card border-none">
                    <CardHeader>
                        <CardTitle className="text-lg font-heading">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentSessions.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-8 text-center italic">No recent sessions yet. Start studying!</p>
                            ) : (
                                recentSessions.map(session => (
                                    <div key={session.id} className="flex items-center group transition-all">
                                        <div className="w-1 h-10 bg-primary/20 rounded-full mr-4 group-hover:bg-primary transition-colors" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold leading-none text-foreground/90 py-1">
                                                {session.taskTitle ? (
                                                    <span>
                                                        Pomo {session.pomoCount || "?"} of {session.totalPomos || "?"} for <span className="text-primary italic">"{session.taskTitle}"</span>
                                                    </span>
                                                ) : (
                                                    <span>Completed Focus Session</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(session.timestamp).toLocaleDateString('en-GB')} at {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-mono text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full">+{session.duration}m</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 glass-card border-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-heading">Active Tasks</CardTitle>
                        <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border border-white/5">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className={cn("text-[10px] h-7 px-2 font-black uppercase tracking-widest rounded-lg", sortBy === "precedence" ? "bg-primary text-white hover:bg-primary" : "text-muted-foreground")}
                                onClick={() => setSortBy("precedence")}
                            >
                                Precedence
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className={cn("text-[10px] h-7 px-2 font-black uppercase tracking-widest rounded-lg", sortBy === "deadline" ? "bg-primary text-white hover:bg-primary" : "text-muted-foreground")}
                                onClick={() => setSortBy("deadline")}
                            >
                                Deadline
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-2">
                            <Button className="flex-1 shadow-lg shadow-primary/20 glow-btn" onClick={handleAddTaskRedirect}>
                                <Plus className="mr-2 h-4 w-4" />
                                Manage in Calendar
                            </Button>
                            {tasks.some(t => t.completed) && (
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="w-12 border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-all"
                                    onClick={handleClearCompleted}
                                    title="Clear Completed Tasks"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {sortedTasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-8 text-center italic">No tasks yet.</p>
                            ) : (
                                sortedTasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                                        <button
                                            onClick={() => handleToggleTask(task.id, task.completed)}
                                            className="text-muted-foreground hover:text-primary transition-all flex-shrink-0"
                                        >
                                            {task.completed
                                                ? <CheckCircle2 className="h-6 w-6 text-primary" />
                                                : <Circle className="h-6 w-6 opacity-40" />
                                            }
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                    task.priority === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                                                )}>
                                                    {task.priority || 'Medium'}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-bold tracking-tight">
                                                    {task.deadline ? `${new Date(task.deadline).toLocaleDateString('en-GB')}` : "No date"} • {task.currentPomos || 0}/{task.totalPomos || 1} Pomos
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
