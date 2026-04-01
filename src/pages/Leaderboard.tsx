import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Award } from "lucide-react"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot } from "firebase/firestore"
import { useAuth } from "@/contexts/AuthContext"

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

// Helper to convert "2h 30m" string to total minutes for sorting
const timeStringToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+)h\s*(\d+)m/);
    if (match) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
}

export default function Leaderboard() {
    const { currentUser } = useAuth()
    const [leaderboardData, setLeaderboardData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            let users = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    id: doc.id,
                    name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Anonymous Student',
                    timeString: data.totalStudyTime || "0h 0m",
                    rawMinutes: timeStringToMinutes(data.totalStudyTime),
                    streak: data.currentStreak || "0",
                    isCurrentUser: currentUser ? doc.id === currentUser.uid : false
                }
            })

            // Sort by raw minutes descending
            users.sort((a, b) => b.rawMinutes - a.rawMinutes)

            // Assign ranks (handling ties natively via index)
            users = users.map((u, index) => ({ ...u, rank: index + 1 }))
            
            setLeaderboardData(users)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Global Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading ranks...</p>
                    ) : (
                        <div className="space-y-4">
                            {leaderboardData.map((user) => (
                                <div
                                    key={user.id}
                                    className={`flex items-center justify-between p-4 rounded-lg ${user.isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {getRankIcon(user.rank)}
                                        <div>
                                            <p className={`font-medium ${user.isCurrentUser ? "text-primary" : ""}`}>
                                                {user.name} {user.isCurrentUser && "(You)"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {user.streak} streak
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{user.timeString}</p>
                                        <p className="text-xs text-muted-foreground">Total Study Time</p>
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
