import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import { useTimer } from "@/contexts/TimerContext"
import { 
    format, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameDay, 
    startOfMonth, 
    endOfMonth, 
    eachWeekOfInterval, 
    isSameWeek, 
    startOfYear, 
    endOfYear, 
    eachMonthOfInterval, 
    isSameMonth 
} from "date-fns"
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell 
} from "recharts"
import { BarChart3, Calendar, TrendingUp, Clock, Target } from "lucide-react"

export default function Reports() {
    const { currentUser } = useAuth()
    const { dailyGoal } = useTimer()
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'))
        })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    const tickColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(30,30,60,0.5)'
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
    const cursorColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'

    useEffect(() => {
        if (!currentUser) return

        const sessionsQuery = query(
            collection(db, "sessions"),
            where("userId", "==", currentUser.uid)
        )

        const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
            const fetchedSessions = snapshot.docs.map(doc => ({
                ...doc.data(),
                date: new Date(doc.data().timestamp)
            }))
            setSessions(fetchedSessions)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser])

    const getDailyData = () => {
        const today = new Date()
        const start = startOfWeek(today, { weekStartsOn: 1 })
        const end = endOfWeek(today, { weekStartsOn: 1 })
        const days = eachDayOfInterval({ start, end })

        return days.map(day => {
            const dailySessions = sessions.filter(s => isSameDay(s.date, day))
            const totalMinutes = dailySessions.reduce((acc, s) => acc + (s.duration || 0), 0)
            return {
                name: format(day, "EEE"),
                hours: parseFloat((totalMinutes / 60).toFixed(1)),
                fullDate: format(day, "MMM d")
            }
        })
    }

    const getWeeklyData = () => {
        const today = new Date()
        const start = startOfMonth(today)
        const end = endOfMonth(today)
        const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })

        return weeks.map((week, index) => {
            const weeklySessions = sessions.filter(s => isSameWeek(s.date, week, { weekStartsOn: 1 }))
            const totalMinutes = weeklySessions.reduce((acc, s) => acc + (s.duration || 0), 0)
            return {
                name: `Week ${index + 1}`,
                hours: parseFloat((totalMinutes / 60).toFixed(1)),
                fullDate: `Week of ${format(week, "MMM d")}`
            }
        })
    }

    const getMonthlyData = () => {
        const today = new Date()
        const start = startOfYear(today)
        const end = endOfYear(today)
        const months = eachMonthOfInterval({ start, end })

        return months.map(month => {
            const monthlySessions = sessions.filter(s => isSameMonth(s.date, month))
            const totalMinutes = monthlySessions.reduce((acc, s) => acc + (s.duration || 0), 0)
            return {
                name: format(month, "MMM"),
                hours: parseFloat((totalMinutes / 60).toFixed(1)),
                fullDate: format(month, "MMMM yyyy")
            }
        })
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-black/90 border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                    <p className="text-[10px] font-black text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1">{payload[0].payload.fullDate}</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{payload[0].value} <span className="text-[10px] text-primary">HOURS</span></p>
                </div>
            )
        }
        return null
    }

    const dayData = getDailyData()
    const weekData = getWeeklyData()
    const monthData = getMonthlyData()

    const todayLabel = format(new Date(), "MMM d")
    const totalHoursToday = dayData.find(d => d.fullDate === todayLabel)?.hours || 0
    const totalHoursWeek = dayData.reduce((acc, d) => acc + d.hours, 0)

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-primary/20 text-primary">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <h1 className="text-4xl font-black font-heading tracking-tight text-slate-900 dark:text-white uppercase italic">Study Intel</h1>
                    </div>
                    <p className="text-muted-foreground font-medium">Analyzing your intellectual offensive data across all sectors.</p>
                </div>

                <div className="flex gap-4">
                    <div className="glass-card p-4 rounded-2xl flex items-center gap-4 min-w-[180px]">
                        <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-500">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Weekly Total</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalHoursWeek.toFixed(1)} <span className="text-xs text-orange-500">h</span></p>
                        </div>
                    </div>
                    <div className="glass-card p-4 rounded-2xl flex items-center gap-4 min-w-[180px]">
                        <div className="p-2.5 rounded-xl bg-green-500/20 text-green-600 dark:text-green-400">
                            <Target className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Daily Goal</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalHoursToday.toFixed(1)} <span className="text-xs text-green-600 dark:text-green-400">/ {dailyGoal}h</span></p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Daily Bar Graph */}
                <div className="bg-white/60 dark:bg-primary/[0.03] border border-slate-200 dark:border-white/5 rounded-3xl p-8 space-y-6 group hover:border-primary/20 transition-all duration-500 shadow-lg shadow-black/5 dark:shadow-xl dark:shadow-black/40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Weekly Payload</h3>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground">STUDY HOURS PER DAY</p>
                            </div>
                        </div>
                        <Calendar className="h-4 w-4 text-slate-400 dark:text-muted-foreground/40" />
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dayData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: tickColor, fontSize: 10, fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: tickColor, fontSize: 10, fontWeight: 900 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: cursorColor }} />
                                <Bar dataKey="hours" radius={[8, 8, 0, 0]} barSize={40}>
                                    {dayData.map((_, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={isSameDay(new Date(), new Date(new Date().setDate(new Date().getDate() - (new Date().getDay() + 6) % 7 + index))) ? '#6366f1' : 'rgba(99, 102, 241, 0.3)'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sub-Reports Grid */}
                <div className="space-y-8">
                    {/* Weekly Month View */}
                    <div className="bg-white/60 dark:bg-indigo-500/[0.03] border border-slate-200 dark:border-white/5 rounded-3xl p-8 space-y-6 hover:border-indigo-500/20 transition-all duration-500 shadow-lg shadow-black/5 dark:shadow-xl dark:shadow-black/40">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Monthly Deployment</h3>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground">STUDY HOURS PER WEEK</p>
                            </div>
                        </div>
                        <div className="h-[180px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weekData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: tickColor, fontSize: 9, fontWeight: 900 }}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: tickColor, fontSize: 9, fontWeight: 900 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: cursorColor }} />
                                    <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly Year View */}
                    <div className="bg-white/60 dark:bg-emerald-500/[0.03] border border-slate-200 dark:border-white/5 rounded-3xl p-8 space-y-6 hover:border-emerald-500/20 transition-all duration-500 shadow-lg shadow-black/5 dark:shadow-xl dark:shadow-black/40">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Annual Trajectory</h3>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground">STUDY HOURS PER MONTH</p>
                            </div>
                        </div>
                        <div className="h-[180px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: tickColor, fontSize: 9, fontWeight: 900 }} 
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: tickColor, fontSize: 9, fontWeight: 900 }} 
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: cursorColor }} />
                                    <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
