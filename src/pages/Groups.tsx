import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus, Trash2, Share2 } from "lucide-react"
import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { useTimer } from "@/contexts/TimerContext"
import { useAuth } from "@/contexts/AuthContext"

export default function Groups() {
    const [groups, setGroups] = useState<any[]>([])
    const [open, setOpen] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [loading, setLoading] = useState(true)
    const [userGroups, setUserGroups] = useState<string[]>([])
    const [haltDialogOpen, setHaltDialogOpen] = useState(false)
    const { currentUser } = useAuth()
    const navigate = useNavigate()
    const { toggleTimer } = useTimer()
    const [inviteCode, setInviteCode] = useState("")
    const [creating, setCreating] = useState(false)

    const GLOBAL_ROOMS = [
        { id: "global-library", name: "The Great Library", desc: "For the most intense deep work sessions.", icon: "🏛️" },
        { id: "global-sanctuary", name: "Silent Sanctuary", desc: "A peaceful sanctuary for light reading.", icon: "🧘" },
        { id: "global-hall", name: "Scholar Hall", desc: "High-energy exam cramming for the elite.", icon: "🎓" }
    ]

    // Listen to groups from Firestore
    useEffect(() => {
        const q = query(collection(db, "groups"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedGroups = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
            setGroups(fetchedGroups)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching groups:", error)
            setLoading(false)
        })

        // Listen to current user's joined groups
        let unsubscribeUser: any = () => {}
        if (currentUser) {
            unsubscribeUser = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
                if (doc.exists()) {
                    setUserGroups(doc.data().joinedGroups || [])
                }
            })
        }

        return () => {
            unsubscribe()
            unsubscribeUser()
        }
    }, [currentUser])

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || !currentUser) return
        setCreating(true)

        try {
            const groupRef = await addDoc(collection(db, "groups"), {
                name: newGroupName,
                members: 1,
                memberIds: [currentUser.uid],
                activeNow: 0,
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid,
                chatMessages: []
            })

            // Add to user's joined groups using atomic union
            const userRef = doc(db, "users", currentUser.uid)
            await updateDoc(userRef, { 
                joinedGroups: arrayUnion(groupRef.id) 
            })

            setNewGroupName("")
            setOpen(false)
            toast.success(`Sanctuary "${newGroupName}" established! 📡`)
            
            // Navigate immediately into the room
            navigate(`/dashboard/groups/${groupRef.id}/room`)
        } catch (error: any) {
            console.error("Group creation protocol failure:", error)
            toast.error(error.message || "Failed to establish sanctuary.")
        } finally {
            setCreating(false)
        }
    }

    const handleJoinGroup = async (groupId: string, groupName: string) => {
        if (!currentUser || userGroups.includes(groupId)) return
        try {
            const groupRef = doc(db, "groups", groupId)
            const userRef = doc(db, "users", currentUser.uid)

            // Update user list atomically
            await updateDoc(userRef, { 
                joinedGroups: arrayUnion(groupId) 
            })

            // Update group member count/list atomically
            const currentGroup = groups.find(g => g.id === groupId)
            await updateDoc(groupRef, {
                memberIds: arrayUnion(currentUser.uid),
                members: (currentGroup?.memberIds?.length || 0) + 1
            })

            toast.success(`Linked to ${groupName} frequency. 🛰️`)
        } catch (err) {
            console.error("Requisition failure:", err)
            toast.error("Failed to link frequency.")
        }
    }

    const handleJoinWithCode = async () => {
        if (!inviteCode.trim() || !currentUser) return
        const code = inviteCode.trim()
        
        if (userGroups.includes(code)) {
            toast.info("You're already in this circle!")
            return
        }

        try {
            const groupSnap = await getDoc(doc(db, "groups", code))
            if (groupSnap.exists()) {
                await handleJoinGroup(code, groupSnap.data().name)
                setInviteCode("")
            } else {
                toast.error("Invalid Sanctuary Code")
            }
        } catch (err) {
            toast.error("Failed to find room")
        }
    }

    const handleLeaveGroup = async (groupId: string, groupName: string) => {
        if (!currentUser) return
        try {
            const groupRef = doc(db, "groups", groupId)
            const userRef = doc(db, "users", currentUser.uid)

            // Update user list atomically
            await updateDoc(userRef, { 
                joinedGroups: arrayRemove(groupId) 
            })

            // Update group member metadata atomically
            await updateDoc(groupRef, {
                memberIds: arrayRemove(currentUser.uid)
            })

            toast.success(`Frequency disconnected from ${groupName}.`)
        } catch (err) {
            console.error("Disconnect failure:", err)
            toast.error("Failed to sever link.")
        }
    }

    const [pendingRoomId] = useState<string | null>(null)

    const handleEnterRoom = (groupId: string) => {
        navigate(`/dashboard/groups/${groupId}/room`)
    }

    const handleConfirmHalt = () => {
        toggleTimer()
        setHaltDialogOpen(false)
        if (pendingRoomId) navigate(`/dashboard/groups/${pendingRoomId}/room`)
        toast.info("Session paused. Entering study room.")
    }

    const handleDeleteGroup = async (groupId: string, groupName: string) => {
        if (!confirm(`Are you sure you want to delete the group "${groupName}"?`)) return;
        
        try {
            await deleteDoc(doc(db, "groups", groupId))
            toast.success(`Group "${groupName}" deleted`)
        } catch (error: any) {
            toast.error(error.message || "Failed to delete group")
        }
    }

    return (
        <>
            <div className="space-y-12">
                <div className="flex items-center justify-between flex-wrap gap-6">
                    <div>
                        <h1 className="text-4xl font-black font-heading tracking-tight">The Hub</h1>
                        <p className="text-muted-foreground mt-1 font-medium">Join a global hall or create a private sanctuary.</p>
                    </div>
                    <div className="flex gap-4 items-center flex-wrap">
                        <div className="flex gap-2 p-1.5 bg-muted/30 border border-border rounded-2xl group focus-within:ring-2 ring-primary/20 transition-all min-w-[320px]">
                            <Input 
                                placeholder="Enter private code..." 
                                className="border-none bg-transparent focus-visible:ring-0 flex-1 font-black tracking-widest text-[11px] px-4"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            />
                            <Button size="sm" className="rounded-xl font-black text-[10px] px-6" onClick={handleJoinWithCode}>JOIN</Button>
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-2xl glow-btn shadow-primary/20 font-black tracking-widest">
                                    <Plus className="mr-2 h-4 w-4" />
                                    CREATE ROOM
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Create Private Sanctuary</DialogTitle>
                                    <DialogDescription>
                                        Create a hidden group with a unique invite code for your squad.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Group Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Finals Survival"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateGroup} className="w-full font-black" disabled={creating}>
                                        {creating ? "UPLOADING..." : "ESTABLISH LINK"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Global Halls Section */}
                <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full" /> Global Halls (Always Open)
                    </h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        {GLOBAL_ROOMS.map(room => (
                            <Card key={room.id} className="glass-card border-none bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group p-6 flex flex-col justify-between relative overflow-hidden" onClick={() => navigate(`/dashboard/groups/${room.id}/room`)}>
                                <div className="relative z-10">
                                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">{room.icon}</div>
                                    <h3 className="font-black font-heading text-xl leading-tight uppercase mb-1">{room.name}</h3>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed mb-4">{room.desc}</p>
                                </div>
                                <Button variant="outline" size="sm" className="w-full bg-primary/5 border-primary/10 group-hover:bg-primary group-hover:text-white font-black text-[10px] tracking-widest transition-all relative z-10">
                                    ENTER HALL
                                </Button>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Your Private Rooms Section */}
                <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-400/40 rounded-full" /> Your Joined Circles
                    </h2>
                    {loading ? (
                        <p className="text-muted-foreground">Syncing halls...</p>
                    ) : userGroups.length === 0 ? (
                        <Card className="glass-card border-dashed bg-transparent py-16 text-center border-white/5">
                            <p className="text-sm text-muted-foreground italic mb-2 opacity-50">No private circles joined.</p>
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-30">Invite your peers to start a squad</p>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {groups
                                .filter(g => userGroups.includes(g.id))
                                .map((group) => {
                                return (
                                    <Card key={group.id} className="glass-card border-none group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden">
                                        <CardHeader className="relative pr-8 pb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-orange-400/10 text-orange-400">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <CardTitle className="text-lg font-heading uppercase">{group.name}</CardTitle>
                                            </div>
                                            <CardDescription className="font-bold flex items-center gap-1 mt-1 text-[11px] uppercase tracking-widest text-green-600 dark:text-green-400">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
                                                LIVE IN ROOM
                                            </CardDescription>
                                            
                                            {group.createdBy === currentUser?.uid && (
                                                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(group.id);
                                                            toast.success("Invite Code Copied! 🛰️");
                                                        }}
                                                        title="Copy Invite Code"
                                                    >
                                                        <Share2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteGroup(group.id, group.name);
                                                        }}
                                                        title="Delete Group"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-4">
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" className="flex-1 bg-primary/5 border-primary/10 hover:bg-primary/10 font-black text-[10px] uppercase tracking-widest" onClick={() => handleEnterRoom(group.id)}>
                                                    ENTER ROOM
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive font-black text-[10px] uppercase tracking-widest" onClick={() => handleLeaveGroup(group.id, group.name)}>
                                                    LEAVE
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </section>
            </div>

            {/* Halt session confirmation dialog */}
            <Dialog open={haltDialogOpen} onOpenChange={setHaltDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Ongoing Session Detected</DialogTitle>
                        <DialogDescription>
                            You have an active focus session running. Do you want to pause it and join this group's session instead?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setHaltDialogOpen(false)}>Keep Current Session</Button>
                        <Button variant="destructive" onClick={handleConfirmHalt}>Pause & Join</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
