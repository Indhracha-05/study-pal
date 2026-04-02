import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus, Trash2 } from "lucide-react"
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
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore"
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
    const { isActive, toggleTimer } = useTimer()

    // Listen to groups from Firestore
    useEffect(() => {
        const q = query(collection(db, "groups"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedGroups = snapshot.docs.map(doc => ({
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

        try {
            const groupRef = await addDoc(collection(db, "groups"), {
                name: newGroupName,
                members: 1,
                memberIds: [currentUser.uid],
                activeNow: 0,
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid
            })

            // Add to user's joined groups
            const userRef = doc(db, "users", currentUser.uid)
            const newJoined = [...userGroups, groupRef.id]
            await updateDoc(userRef, { joinedGroups: newJoined })

            setNewGroupName("")
            setOpen(false)
            toast.success(`Group "${newGroupName}" created!`)
        } catch (error: any) {
            toast.error(error.message || "Failed to create group")
        }
    }

    const handleJoinGroup = async (groupId: string, groupName: string) => {
        if (!currentUser) return
        try {
            const groupRef = doc(db, "groups", groupId)
            const userRef = doc(db, "users", currentUser.uid)

            // Update user list
            const newJoined = [...userGroups, groupId]
            await updateDoc(userRef, { joinedGroups: newJoined })

            // Update group member count/list
            const groupDoc = await getDoc(groupRef)
            if (groupDoc.exists()) {
                const currentMembers = groupDoc.data().memberIds || []
                await updateDoc(groupRef, {
                    memberIds: [...currentMembers, currentUser.uid],
                    members: currentMembers.length + 1
                })
            }

            toast.success(`Welcome to ${groupName}!`)
        } catch (err) {
            toast.error("Failed to join group")
        }
    }

    const handleLeaveGroup = async (groupId: string, groupName: string) => {
        if (!currentUser) return
        try {
            const groupRef = doc(db, "groups", groupId)
            const userRef = doc(db, "users", currentUser.uid)

            // Update user list
            const newJoined = userGroups.filter(id => id !== groupId)
            await updateDoc(userRef, { joinedGroups: newJoined })

            // Update group member count/list
            const groupDoc = await getDoc(groupRef)
            if (groupDoc.exists()) {
                const currentMembers = groupDoc.data().memberIds || []
                const newMembers = currentMembers.filter((id: string) => id !== currentUser.uid)
                await updateDoc(groupRef, {
                    memberIds: newMembers,
                    members: Math.max(0, newMembers.length)
                })
            }

            toast.success(`Left ${groupName}`)
        } catch (err) {
            toast.error("Failed to leave group")
        }
    }

    const [pendingRoomId, setPendingRoomId] = useState<string | null>(null)

    const handleEnterRoom = (groupId: string) => {
        if (isActive) {
            setPendingRoomId(groupId)
            setHaltDialogOpen(true)
        } else {
            navigate(`/dashboard/groups/${groupId}/room`)
        }
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
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Study Groups</h1>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Group
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create Study Group</DialogTitle>
                                <DialogDescription>
                                    Create a new group to study together with your friends.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Group Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Advanced Calculus"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateGroup}>Create Group</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <p className="text-muted-foreground">Loading groups from database...</p>
                ) : groups.length === 0 ? (
                    <p className="text-muted-foreground">No groups found. Be the first to create one!</p>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {groups.map((group) => {
                            const isJoined = userGroups.includes(group.id)
                            return (
                                <Card key={group.id} className="glass-card border-none group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden">
                                    <CardHeader className="relative pr-8 pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <CardTitle className="text-lg font-heading">{group.name}</CardTitle>
                                        </div>
                                        <CardDescription className="font-bold flex items-center gap-1 mt-1 text-[11px] uppercase tracking-widest text-muted-foreground/60">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
                                            {group.activeNow} Studying Now
                                        </CardDescription>
                                        
                                        {group.createdBy === currentUser?.uid && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                onClick={() => handleDeleteGroup(group.id, group.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                                            <div>
                                                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50">Members</p>
                                                <p className="text-xl font-black font-mono">{group.members}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50">Level</p>
                                                <p className="text-xl font-black font-mono text-primary">LVL {Math.floor(group.members / 5) + 1}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isJoined ? (
                                                <>
                                                    <Button variant="outline" size="sm" className="flex-1 bg-primary/5 border-primary/10 hover:bg-primary/10 font-bold" onClick={() => handleEnterRoom(group.id)}>
                                                        Enter Room
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => handleLeaveGroup(group.id, group.name)}>
                                                        Leave
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button className="w-full font-bold glow-btn" onClick={() => handleJoinGroup(group.id, group.name)}>
                                                    Join Group
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
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
