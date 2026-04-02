import { useParams, Link } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, collection, query, where, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, Zap, Trophy, Brain, Flame, Send, MessageSquare } from "lucide-react"
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
    const { isActive, mode, timeLeft, tasks, selectedTaskId } = useTimer()

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    }


    const [groupName, setGroupName] = useState("Study Room")
    const [members, setMembers] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(true)
    const lastStatusRef = useRef<string>("")
    const lastTaskRef = useRef<string | null>(null)

    const currentTask = tasks.find(t => t.id === selectedTaskId)

    // Listen to group info and messages
    useEffect(() => {
        if (!groupId) return
        const unsub = onSnapshot(doc(db, "groups", groupId), (snap) => {
            if (snap.exists()) {
                const data = snap.data()
                setGroupName(data.name)
                if (data.chatMessages) {
                    setMessages(data.chatMessages)
                }
            }
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
        }).catch(() => { })

        updateDoc(groupRef, { activeMembersList: arrayUnion(currentUser.uid) }).catch(() => { })

        return () => {
            // Leave: clear presence
            updateDoc(userRef, { "presence.groupId": null, "presence.status": "Offline" }).catch(() => { })
            updateDoc(groupRef, { activeMembersList: arrayRemove(currentUser.uid) }).catch(() => { })
        }
    }, [groupId, currentUser])

    // Update own status whenever timer or task changes
    useEffect(() => {
        if (!currentUser) return
        const newStatus = isActive ? (mode === "FOCUS" ? "Deep Focus 🔥" : "On Break ☕") : "Prepping"
        const newTask = (isActive && mode === "FOCUS") ? (currentTask?.title || "Focusing") : null

        // ONLY update if something actually changed to prevent infinite loops
        if (newStatus !== lastStatusRef.current || newTask !== lastTaskRef.current) {
            lastStatusRef.current = newStatus
            lastTaskRef.current = newTask
            updateDoc(doc(db, "users", currentUser.uid), {
                "presence.status": newStatus,
                "presence.currentTask": newTask
            }).catch(() => { })
        }
    }, [isActive, mode, currentUser, selectedTaskId, currentTask?.title])

    // Listen to all members who are currently IN this room (Presence-based)
    useEffect(() => {
        if (!groupId) return

        // If it's a global room, show anyone currently active inside it
        // If it's private, show all group members (so you see them even if offline)
        const isGlobal = groupId.startsWith("global-")
        const q = isGlobal
            ? query(collection(db, "users"), where("presence.groupId", "==", groupId))
            : query(collection(db, "users"), where("joinedGroups", "array-contains", groupId))

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setMembers(data)
            setLoading(false)
        })
        return () => unsub()
    }, [groupId])



    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim() || !currentUser || !groupId) return

        const userDoc = members.find(m => m.id === currentUser.uid)
        const fullName = userDoc ? `${userDoc.firstName || ""} ${userDoc.lastName || ""}`.trim() || userDoc.email : "Scholar"

        try {
            await updateDoc(doc(db, "groups", groupId), {
                chatMessages: arrayUnion({
                    id: Date.now().toString(),
                    userId: currentUser.uid,
                    userName: fullName,
                    text: newMessage.trim(),
                    timestamp: new Date().toISOString()
                })
            })
            setNewMessage("")
        } catch (error: any) {
            console.error("Failed to send comms:", error)
        }
    }

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
                            {activeMembers.length} Scholar{activeMembers.length !== 1 ? "s" : ""} in room now
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

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                {/* Main Content: Members */}
                <div className="space-y-8">
                    {/* In-Room Members */}
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Room Presence
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
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {activeMembers.map((member: any) => {
                                    const isSelf = member.id === currentUser?.uid
                                    const status = isSelf
                                        ? (isActive ? (mode === "FOCUS" ? "Deep Focus 🔥" : "On Break ☕") : "Idle")
                                        : (member.presence?.status || "Studying")
                                    const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email

                                    return (
                                        <Card key={member.id} className={cn(
                                            "glass-card border-none transition-all duration-500 overflow-hidden group hover:shadow-xl",
                                            isSelf && "border border-primary/30 ring-2 ring-primary/10 bg-primary/5 shadow-primary/5"
                                        )}>
                                            <CardHeader className="pb-2 flex flex-row items-center gap-3 space-y-0">
                                                <MemberAvatar name={fullName} email={member.email} size="md" />
                                                <div className="min-w-0">
                                                    <CardTitle className="text-xs font-bold truncate">
                                                        {fullName} {isSelf && <span className="text-primary text-[9px] font-black uppercase ml-1">You</span>}
                                                    </CardTitle>
                                                    <p className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest truncate flex items-center gap-1 mt-0.5",
                                                        status.includes("Focus") ? "text-orange-400" : "text-muted-foreground"
                                                    )}>
                                                        {status.includes("Focus") ? <Flame className="h-2.5 w-2.5 fill-orange-400" />
                                                            : status.includes("Break") ? <Brain className="h-2.5 w-2.5" />
                                                                : null}
                                                        {status}
                                                    </p>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {member.presence?.currentTask && (
                                                    <div className="mb-3 px-2.5 py-1.5 bg-primary/5 border border-primary/10 rounded-lg">
                                                        <p className="text-[10px] font-bold text-primary/80 truncate flex items-center gap-1.5">
                                                            <span className="w-1 h-1 rounded-full bg-primary" />
                                                            {member.presence.currentTask}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2 text-[10px]">
                                                    <span className="text-muted-foreground/50 uppercase font-black tracking-wider leading-tight">Total<br />Streak</span>
                                                    <span className="font-black font-mono text-primary flex items-center gap-1.5 whitespace-nowrap text-right">
                                                        <Trophy className="h-3 w-3" /> {member.currentStreak || "0 Days"}
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
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/20 mb-4 flex items-center gap-2">
                                <Users className="h-3 w-3" /> Offline Members
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {idleMembers.map((m: any) => {
                                    const fullName = `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email
                                    return (
                                        <div key={m.id} className="flex items-center gap-2 bg-muted/10 rounded-full pl-1.5 pr-2.5 py-1 text-[10px] text-muted-foreground/50 border border-white/5">
                                            <MemberAvatar name={fullName} email={m.email} size="sm" />
                                            {fullName}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: Leaderboard & Activity */}
                <div className="space-y-6">
                    {/* Room MVP Leaderboard */}
                    <Card className="glass-card border-none bg-primary/5 pb-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                                <Trophy className="h-4 w-4" /> Room MVP
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {members
                                .sort((a, b) => (b.dailyXP || 0) - (a.dailyXP || 0))
                                .slice(0, 3)
                                .map((m, i) => (
                                    <div key={m.id} className={cn(
                                        "flex items-center justify-between p-2 rounded-xl border border-white/5",
                                        i === 0 ? "bg-primary/10 border-primary/20" : "bg-white/5"
                                    )}>
                                        <div className="flex items-center gap-2 max-w-[120px]">
                                            <span className="text-[10px] font-black text-muted-foreground w-3">#{i + 1}</span>
                                            <MemberAvatar name={m.firstName} email={m.email} size="sm" />
                                            <span className="text-[10px] font-bold truncate">{m.firstName || m.email.split('@')[0]}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black font-mono text-primary">{(m.dailyXP || 0)} XP</p>
                                            <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Today</p>
                                        </div>
                                    </div>
                                ))}
                            {members.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4 italic">No sessions today</p>}
                        </CardContent>
                    </Card>

                    {/* Live Comms Chat */}
                    <Card className="glass-card border-none bg-black/20 h-[350px] flex flex-col">
                        <CardHeader className="pb-3 border-b border-white/5">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
                                <MessageSquare className="h-3.5 w-3.5" /> Live Comms
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-4 scrollbar-hide px-4 py-4 flex flex-col">
                            {messages.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-[10px] text-muted-foreground/30 italic text-center px-6">
                                    No comms yet. Deploy the first message.
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isSelf = msg.userId === currentUser?.uid
                                    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    return (
                                        <div key={msg.id} className={cn(
                                            "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
                                            isSelf ? "self-end items-end" : "self-start items-start"
                                        )}>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1 ml-1">
                                                {isSelf ? "You" : msg.userName} • {timeStr}
                                            </span>
                                            <div className={cn(
                                                "px-4 py-2 rounded-2xl text-sm font-medium",
                                                isSelf
                                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                    : "bg-white/10 text-slate-100 rounded-tl-sm"
                                            )}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>
                        <CardFooter className="p-3 bg-black/20 border-t border-white/5">
                            <form onSubmit={handleSendMessage} className="flex gap-2 w-full pt-1">
                                <Input
                                    placeholder="Transmit message..."
                                    className="bg-black/40 border-white/10 text-sm h-10 focus-visible:ring-primary/50"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <Button type="submit" size="icon" disabled={!newMessage.trim()} className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>

                    {/* Room Pulse Activity Feed */}
                    <Card className="glass-card border-none bg-black/10 h-[200px] flex flex-col">
                        <CardHeader className="pb-3 border-b border-white/5">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground/60">
                                <Flame className="h-3.5 w-3.5" /> Context Subroutines
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-4 scrollbar-hide px-4 py-4">
                            {activeMembers.map((m) => (
                                <div key={m.id} className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="w-1 h-full rounded-full bg-primary/20 self-stretch" />
                                    <div>
                                        <p className="text-[10px] leading-relaxed">
                                            <span className="font-bold text-primary">{m.firstName || "Scholar"}</span> is{" "}
                                            {m.presence?.status?.toLowerCase().includes("focus") ? "initiating deep-dive protocols" : "taking a scheduled downtime breather"}.
                                        </p>
                                        <p className="text-[8px] text-muted-foreground mt-0.5 opacity-50 uppercase font-black">Subroutine Active</p>
                                    </div>
                                </div>
                            ))}
                            {activeMembers.length === 0 && (
                                <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground/30 italic text-center px-6">
                                    The room is quiet. Enter the space to establish context.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
