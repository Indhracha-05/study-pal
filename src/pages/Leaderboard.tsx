import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Award } from "lucide-react"

const leaderboardData = [
    { rank: 1, name: "Alex Chen", hours: 48, streak: 15 },
    { rank: 2, name: "Sarah Miller", hours: 42, streak: 12 },
    { rank: 3, name: "James Wilson", hours: 38, streak: 10 },
    { rank: 4, name: "Emily Davis", hours: 35, streak: 8 },
    { rank: 5, name: "Michael Brown", hours: 32, streak: 7 },
    { rank: 6, name: "You", hours: 28, streak: 5, isCurrentUser: true },
]

const getRankIcon = (rank: number) => {
    switch (rank) {
        case 1:
            return <Trophy className="h-5 w-5 text-yellow-500" />
        case 2:
            return <Medal className="h-5 w-5 text-gray-400" />
        case 3:
            return <Award className="h-5 w-5 text-amber-600" />
        default:
            return <span className="w-5 text-center font-bold text-muted-foreground">#{rank}</span>
    }
}

export default function Leaderboard() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Weekly Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {leaderboardData.map((user) => (
                            <div
                                key={user.rank}
                                className={`flex items-center justify-between p-4 rounded-lg ${user.isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    {getRankIcon(user.rank)}
                                    <div>
                                        <p className={`font-medium ${user.isCurrentUser ? "text-primary" : ""}`}>
                                            {user.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.streak} day streak
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{user.hours}h</p>
                                    <p className="text-xs text-muted-foreground">this week</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
