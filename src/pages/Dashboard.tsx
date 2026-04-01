import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Timer, Trophy, Flame, Plus, Trash2, CheckCircle2, Circle } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, collection, query, where, addDoc, deleteDoc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalStudyTime: "0h 0m",
        currentStreak: "0 Days",
        rank: "Newbie",
    })
    const [activeGroupsCount, setActiveGroupsCount] = useState(0)
    const [recentSessions, setRecentSessions] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])
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
                    })
                } catch (e) {
                    console.error("Could not initialize user document:", e)
                }
            }
        })

        // Listen to recent sessions
        const sessionsQuery = query(
            collection(db, "sessions"),
            where("userId", "==", currentUser.uid)
        )
        const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
            const sessions: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            // Sort client-side to avoid Firebase composite index requirements
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
            // Sort client-side to avoid Firebase composite index requirements
            fetchedTasks.sort((a, b) => {
                if (a.completed && !b.completed) return 1
                if (!a.completed && b.completed) return -1
                
                // Primary: Priority (High > Medium > Low)
                const pMap: any = { high: 0, medium: 1, low: 2 }
                const pDiff = (pMap[a.priority] || 1) - (pMap[b.priority] || 1)
                
                if (pDiff !== 0) return pDiff

                // Secondary: Deadline (Earlier first)
                if (a.deadline && b.deadline) {
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
                }
                if (a.deadline) return -1
                if (b.deadline) return 1

                const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now()
                const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now()
                return aTime - bTime
            })
            setTasks(fetchedTasks)
        }, (error) => {
            console.error("Tasks snapshot error:", error)
        })

        // Listen to active groups count (how many groups exist globally)
        const groupsQuery = collection(db, "groups")
        const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
            setActiveGroupsCount(snapshot.size)
        }, (error) => {
            console.error("Groups count error:", error)
        })

        return () => {
            unsubscribeSnapshot()
            unsubscribeSessions()
            unsubscribeTasks()
            unsubscribeGroups()
        }
    }, [currentUser])

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
                        <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalStudyTime}</div>
                        <p className="text-xs text-muted-foreground">Keep it up!</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.currentStreak}</div>
                        <p className="text-xs text-muted-foreground">Keep it up!</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rank</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">#{stats.rank}</div>
                        <p className="text-xs text-muted-foreground">Top 10% of users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeGroupsCount}</div>
                        <p className="text-xs text-muted-foreground">Stay connected</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentSessions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent sessions yet. Start studying!</p>
                            ) : (
                                recentSessions.map(session => (
                                    <div key={session.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-semibold leading-none">
                                                {session.taskTitle ? (
                                                    <span>
                                                        Pomo {session.pomoCount || "?"} of {session.totalPomos || "?"} for <span className="text-primary italic">"{session.taskTitle}"</span>
                                                    </span>
                                                ) : (
                                                    <span>Completed Session</span>
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(session.timestamp).toLocaleDateString()} at {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-mono text-sm font-bold text-primary">+{session.duration}m</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button className="w-full shadow-sm" onClick={handleAddTaskRedirect}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Task in Calendar
                        </Button>

                        {/* Task list */}
                        <div className="space-y-2">
                            {tasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No tasks yet. Add one above!</p>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-3 group p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <button
                                            onClick={() => handleToggleTask(task.id, task.completed)}
                                            className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                                        >
                                            {task.completed
                                                ? <CheckCircle2 className="h-5 w-5 text-primary" />
                                                : <Circle className="h-5 w-5" />
                                            }
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                                }`} />
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString('en-GB')}` : "No deadline"}
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
