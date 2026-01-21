import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import { useState } from "react"
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
import { Link } from "react-router-dom"
import { toast } from "sonner"

const initialGroups = [
    { id: 1, name: "DSA Daily", members: 12, activeNow: 3 },
    { id: 2, name: "Semester 3 Prep", members: 8, activeNow: 2 },
    { id: 3, name: "Web Dev Learners", members: 15, activeNow: 5 },
]

export default function Groups() {
    const [groups, setGroups] = useState(initialGroups)
    const [open, setOpen] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) return

        const newGroup = {
            id: groups.length + 1,
            name: newGroupName,
            members: 1,
            activeNow: 0
        }

        setGroups([...groups, newGroup])
        setNewGroupName("")
        setOpen(false)
        toast.success(`Group "${newGroup.name}" created!`)
    }

    return (
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                    <Card key={group.id}>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <CardTitle>{group.name}</CardTitle>
                            </div>
                            <CardDescription>{group.members} members</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {group.activeNow} active now
                                </span>
                                <Button variant="outline" size="sm" asChild>
                                    <Link to="/dashboard/sessions">Join Session</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
