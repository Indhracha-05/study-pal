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
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from "firebase/firestore"
import { useTimer } from "@/contexts/TimerContext"

export default function Groups() {
    const [groups, setGroups] = useState<any[]>([])
    const [open, setOpen] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [loading, setLoading] = useState(true)
    const [haltDialogOpen, setHaltDialogOpen] = useState(false)
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

        return () => unsubscribe()
    }, [])

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return

        try {
            await addDoc(collection(db, "groups"), {
                name: newGroupName,
                members: 1,
                activeNow: 0,
                createdAt: serverTimestamp()
            })

            setNewGroupName("")
            setOpen(false)
            toast.success(`Group "${newGroupName}" created in Firebase!`)
        } catch (error: any) {
            toast.error(error.message || "Failed to create group")
        }
    }

    const handleJoinSession = () => {
        if (isActive) {
            // Timer is running — prompt user first
            setHaltDialogOpen(true)
        } else {
            navigate("/dashboard/sessions")
        }
    }

    const handleConfirmHalt = () => {
        toggleTimer() // pause the timer
        setHaltDialogOpen(false)
        navigate("/dashboard/sessions")
        toast.info("Previous session paused. Starting new session.")
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
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {groups.map((group) => (
                            <Card key={group.id}>
                                <CardHeader className="relative pr-8">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        <CardTitle>{group.name}</CardTitle>
                                    </div>
                                    <CardDescription>{group.members} members</CardDescription>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                        onClick={() => handleDeleteGroup(group.id, group.name)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete Group</span>
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            {group.activeNow} active now
                                        </span>
                                        <Button variant="outline" size="sm" onClick={handleJoinSession}>
                                            Join Session
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
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
