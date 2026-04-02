import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Award, Clock } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot } from "firebase/firestore"
import { useAuth } from "@/contexts/AuthContext"
import { isSameDay, isSameWeek } from "date-fns"
import { cn } from "@/lib/utils"

const getRankIcon = (rank: number) => {
    switch (rank) {
        case 1:
            return <Trophy className="h-5 w-5 text-yellow-500" />
        case 2:
            return <Medal className="h-5 w-5 text-slate-400" />
        case 3:
            return <Award className="h-5 w-5 text-amber-600" />
        default:
            return <span className="w-5 text-center font-black text-muted-foreground/50">#{rank}</span>
    }
}

// Helper to convert "2h 30m" string to total minutes for sorting
const timeStringToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+)h\s*(\d+)m/);
    if (match) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
}

type Timeframe = "daily" | "weekly" | "total"

export default function Leaderboard() {
    const { currentUser } = useAuth()
    const [timeframe, setTimeframe] = useState<Timeframe>("total")
    const [usersData, setUsersData] = useState<any[]>([])
    const [sessionsData, setSessionsData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch users
        const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setUsersData(users)
        })

        // Fetch sessions
        const unsubscribeSessions = onSnapshot(collection(db, "sessions"), (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setSessionsData(sessions)
            setLoading(false)
        })

        return () => {
            unsubscribeUsers()
            unsubscribeSessions()
        }
    }, [])

    const leaderboardData = useMemo(() => {
        if (!usersData.length) return []
        
        const now = new Date()
        
        let users = usersData.map(u => {
            const isCurrentUser = currentUser ? u.id === currentUser.uid : false
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonymous Student'
            const streak = u.currentStreak || "0 Days"
            
            let rawMinutes = 0
            
            if (timeframe === "total") {
                rawMinutes = timeStringToMinutes(u.totalStudyTime)
            } else {
                const userSessions = sessionsData.filter(s => s.userId === u.id)
                userSessions.forEach(s => {
                    if (!s.timestamp) return
                    const sDate = new Date(s.timestamp)
                    if (timeframe === "daily" && isSameDay(sDate, now)) {
                        rawMinutes += (s.duration || 0)
                    } else if (timeframe === "weekly" && isSameWeek(sDate, now, { weekStartsOn: 1 })) {
                        rawMinutes += (s.duration || 0)
                    }
                })
            }

            return {
                id: u.id,
                name,
                streak,
                rawMinutes,
                timeString: `${Math.floor(rawMinutes / 60)}h ${rawMinutes % 60}m`,
                isCurrentUser
            }
        })

        // For daily and weekly, optionally drop people with 0 minutes to keep board active-only
        if (timeframe !== "total") {
            users = users.filter(u => u.rawMinutes > 0 || u.isCurrentUser)
        }

        // Sort by raw minutes descending
        users.sort((a, b) => b.rawMinutes - a.rawMinutes)

        // Assign ranks and return
        return users.map((u, index) => ({ ...u, rank: index + 1 }))
    }, [usersData, sessionsData, timeframe, currentUser])

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black font-heading tracking-tight">Leaderboard</h1>
                    <p className="text-muted-foreground mt-1 font-medium">Compare your stats with peers worldwide.</p>
                </div>
                
                {/* Timeframe Selector */}
                <div className="flex bg-muted/40 p-1.5 rounded-2xl border border-border">
                    {["daily", "weekly", "total"].map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf as Timeframe)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                timeframe === tf 
                                    ? "bg-white dark:bg-primary shadow-lg shadow-black/5 dark:shadow-primary/20 text-slate-900 dark:text-white" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="glass-card border-none overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/50 pb-6">
                    <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        {timeframe === "daily" ? "Today's Rankings" : timeframe === "weekly" ? "This Week's Rankings" : "All-Time Global Rankings"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center">
                            <p className="text-sm font-black tracking-widest uppercase text-muted-foreground animate-pulse">Syncing Ranks...</p>
                        </div>
                    ) : leaderboardData.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground/50 italic font-medium">
                            No study sessions logged for this timeframe yet. Be the first!
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {leaderboardData.map((user) => (
                                <div
                                    key={user.id}
                                    className={cn(
                                        "flex items-center justify-between p-6 transition-all hover:bg-muted/20",
                                        user.isCurrentUser ? "bg-primary/[0.02] dark:bg-primary/5 relative" : ""
                                    )}
                                >
                                    {user.isCurrentUser && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                                    )}
                                    <div className="flex items-center gap-6">
                                        <div className="w-8 flex justify-center">
                                            {getRankIcon(user.rank)}
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "font-black text-lg",
                                                user.isCurrentUser ? "text-primary" : "text-slate-900 dark:text-white"
                                            )}>
                                                {user.name} {user.isCurrentUser && <span className="text-xs uppercase tracking-widest opacity-50 ml-2">(You)</span>}
                                            </p>
                                            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mt-1">
                                                {user.streak} streak
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-2xl text-slate-900 dark:text-white">
                                            {user.timeString}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">
                                            Target Accrued
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
