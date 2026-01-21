import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Trophy, Timer } from "lucide-react"
import { Link } from "react-router-dom"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="px-6 py-4 flex items-center justify-between border-b">
                <Link to="/" className="hover:opacity-80 transition-opacity">
                    <h1 className="text-xl font-bold">Study Pal</h1>
                </Link>
                <nav className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link to="/login">
                        <Button variant="ghost">Log In</Button>
                    </Link>
                    <Link to="/signup">
                        <Button>Get Started</Button>
                    </Link>
                </nav>
            </header>
            <main className="flex-1">
                <section className="py-20 px-6 text-center bg-muted/20">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        Study Together, <span className="text-primary">Achieve More</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                        Join a community of motivated learners. Track productivity, join study groups, and climb the leaderboard in a stress-free environment.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link to="/dashboard">
                            <Button size="lg" className="rounded-full px-8">Start Studying</Button>
                        </Link>
                    </div>
                </section>

                <section className="py-16 px-6 grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
                    <Card>
                        <CardHeader>
                            <Users className="w-10 h-10 mb-2 text-primary" />
                            <CardTitle>Study Groups</CardTitle>
                            <CardDescription>Join groups with shared goals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            Connect with peers, share progress, and stay accountable.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Timer className="w-10 h-10 mb-2 text-primary" />
                            <CardTitle>Focus Timer</CardTitle>
                            <CardDescription>Pomodoro & stopwatch sessions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            Track your deep work sessions and visualize your daily progress.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Trophy className="w-10 h-10 mb-2 text-primary" />
                            <CardTitle>Leaderboards</CardTitle>
                            <CardDescription>Friendly motivation.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            Compete on consistency and effort, not just raw hours.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <BookOpen className="w-10 h-10 mb-2 text-primary" />
                            <CardTitle>Productivity Stats</CardTitle>
                            <CardDescription>Track your streaks.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            Get insights into your study habits and maintain your streak.
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    )
}
