import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"

const groups = [
    { id: 1, name: "DSA Daily", members: 12, activeNow: 3 },
    { id: 2, name: "Semester 3 Prep", members: 8, activeNow: 2 },
    { id: 3, name: "Web Dev Learners", members: 15, activeNow: 5 },
]

export default function Groups() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Study Groups</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group
                </Button>
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
                                <Button variant="outline" size="sm">Join Session</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
