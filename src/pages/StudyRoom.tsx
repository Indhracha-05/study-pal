import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, collection, query, where, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Zap, Trophy, Brain, Flame } from "lucide-react"
import { useTimer } from "@/contexts/TimerContext"
import { cn } from "@/lib/utils"

function MemberAvatar({ name, email, size = "md" }: { name?: string, email?: string, size?: "sm" | "md" | "lg" }) {
    const initials = name ? name[0].toUpperCase() : (email ? email[0].toUpperCase() : "?")
    const colors = ["bg-violet-500", "bg-indigo-500", "bg-sky-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500"]
    const colorIdx = (email?.charCodeAt(0) || 0) % colors.length
    const sizeClass = size === "lg" ? "w-16 h-16 text-2xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-12 h-12 text-lg"
    return (
        <div className={cn("rounded-2xl flex items-center justify-center font-black text-white shadow-lg", sizeClass, colors[colorIdx])}>
            {initials}
        </div>
    )
}

export default function StudyRoom() {
    const { groupId } = useParams()
    const { currentUser } = useAuth()
    const { isActive, mode, formatTime, timeLeft, tasks, selectedTaskId } = useTimer()
    const [groupName, setGroupName] = useState("Study Room")
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const currentTask = tasks.find(t => t.id === selectedTaskId)

    // Listen to group info
    useEffect(() => {
        if (!groupId) return
        const unsub = onSnapshot(doc(db, "groups", groupId), (snap) => {
            if (snap.exists()) setGroupName(snap.data().name)
        })
        return () => unsub()
    }, [groupId])

    // Mark self as present in this room
    useEffect(() => {
        if (!groupId || !currentUser) return

        const userRef = doc(db, "users", currentUser.uid)
        const groupRef = doc(db, "groups", groupId)

        // Join: write presence
        updateDoc(userRef, {
            "presence.groupId": groupId,
            "presence.status": isActive ? (mode === "FOCUS" ? "Deep Focus 🔥" : "On Break ☕") : "Prepping",
            "presence.currentTask": (isActive && mode === "FOCUS") ? (currentTask?.title || "Focusing") : null,
            "presence.updatedAt": new Date().toISOString()
        }).catch(() => {})

        updateDoc(groupRef, { activeMembersList: arrayUnion(currentUser.uid) }).catch(() => {})

        return () => {
            // Leave: clear presence
            updateDoc(userRef, { "presence.groupId": null, "presence.status": "Offline" }).catch(() => {})
            updateDoc(groupRef, { activeMembersList: arrayRemove(currentUser.uid) }).catch(() => {})
        }
    }, [groupId, currentUser])

    // Update own status whenever timer or task changes
    useEffect(() => {
        if (!currentUser) return
        updateDoc(doc(db, "users", currentUser.uid), {
            "presence.status": isActive ? (mode === "FOCUS" ? "Deep Focus 🔥" : "On Break ☕") : "Prepping",
            "presence.currentTask": (isActive && mode === "FOCUS") ? (currentTask?.title || "Focusing") : null
        }).catch(() => {})
    }, [isActive, mode, currentUser, selectedTaskId, currentTask?.title])

    // Listen to all members in the group
    useEffect(() => {
        if (!groupId) return
        const q = query(collection(db, "users"), where("joinedGroups", "array-contains", groupId))
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setMembers(data)
            setLoading(false)
        })
        return () => unsub()
    }, [groupId])

    const activeMembers = members.filter((m: any) => m.presence?.groupId === groupId)
    const idleMembers = members.filter((m: any) => m.presence?.groupId !== groupId)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-primary/10">
                        <Link to="/dashboard/groups"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight gradient-text font-heading uppercase">{groupName}</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                            {activeMembers.length} Scholar{activeMembers.length !== 1 ? "s" : ""} in room now · {members.length} total members
                        </p>
                    </div>
                </div>

                {/* Your Mini Timer */}
                <Card className="glass-card border-primary/20 bg-primary/5 px-6 py-3">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-primary/50">Your Timer</p>
                            <p className="text-3xl font-black font-mono tracking-tighter">{formatTime(timeLeft)}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{mode.replace("_", " ")}</p>
                        </div>
                        <div className={cn(
                            "p-3 rounded-2xl transition-all",
                            isActive ? "bg-primary shadow-lg shadow-primary/40 text-white animate-pulse" : "bg-muted/40 text-muted-foreground"
                        )}>
                            <Zap className="h-6 w-6" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* In-Room Members */}
            <div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> In Room
                </h2>
                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading room...</p>
                ) : activeMembers.length === 0 ? (
                    <Card className="glass-card border-dashed bg-transparent py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
                                <Users className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm text-muted-foreground italic">No one's in the room yet.</p>
                            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">Be the first to enter</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {activeMembers.map((member: any) => {
                            const isSelf = member.id === currentUser?.uid
                            const status = isSelf
                                ? (isActive ? (mode === "FOCUS" ? "Deep Focus 🔥" : "On Break ☕") : "Idle")
                                : (member.presence?.status || "Studying")
                            const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email

                            return (
                                <Card key={member.id} className={cn(
                                    "glass-card border-none transition-all duration-500 overflow-hidden group",
                                    isSelf && "border border-primary/30 ring-2 ring-primary/10 bg-primary/5"
                                )}>
                                    <CardHeader className="pb-2 flex flex-row items-center gap-4">
                                        <MemberAvatar name={fullName} email={member.email} size="md" />
                                        <div className="min-w-0">
                                            <CardTitle className="text-sm font-bold truncate">
                                                {fullName} {isSelf && <span className="text-primary text-[10px]">(You)</span>}
                                            </CardTitle>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate flex items-center gap-1 mt-0.5">
                                                {status.includes("Focus") ? <Flame className="h-3 w-3 text-orange-400 fill-orange-400" />
                                                    : status.includes("Break") ? <Brain className="h-3 w-3" />
                                                        : null}
                                                {status}
                                            </p>
                                            {member.presence?.currentTask && (
                                                <div className="mt-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md inline-block max-w-full">
                                                    <p className="text-[9px] font-bold text-primary truncate">🎯 {member.presence.currentTask}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 text-[11px]">
                                            <span className="text-muted-foreground/50 uppercase font-black tracking-widest text-[8px]">Streak</span>
                                            <span className="font-black font-mono text-primary flex items-center gap-1">
                                                <Trophy className="h-3 w-3" /> {member.currentStreak || "0"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Group Members Not In Room */}
            {idleMembers.length > 0 && (
                <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-4">
                        Also in group — not in room
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {idleMembers.map((m: any) => {
                            const fullName = `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email
                            return (
                                <div key={m.id} className="flex items-center gap-2 bg-muted/20 rounded-full px-3 py-1.5 text-xs text-muted-foreground/60">
                                    <MemberAvatar name={fullName} email={m.email} size="sm" />
                                    {fullName}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
