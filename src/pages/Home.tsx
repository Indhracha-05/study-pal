import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Trophy, Timer, ArrowRight, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"
import { ThemeToggle } from "@/components/ThemeToggle"
import ParticleCanvas from "@/components/ParticleCanvas"

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Study Pal</h1>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link to="/login">
                            <Button variant="ghost" className="font-medium">Log In</Button>
                        </Link>
                        <Link to="/signup">
                            <Button className="rounded-full font-medium shadow-lg shadow-primary/20">Get Started</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden py-32 px-6 min-h-[600px]">
                    {/* Background decorations - Antigravity Particle System */}
                    <div className="absolute inset-0 -z-10 bg-background dark:bg-[#030712] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background pointer-events-none" />
                    </div>
                    
                    <ParticleCanvas />

                    <div className="container mx-auto text-center max-w-4xl relative z-10">
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
                            <Sparkles className="mr-2 h-4 w-4" />
                            The Ultimate Study Companion
                        </div>
                        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Study Together, <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Achieve More.</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
                            Join a community of motivated learners. Track productivity, join study groups, and climb the leaderboard in a stress-free environment.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link to="/dashboard">
                                <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group">
                                    Start Studying
                                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 px-6 bg-muted/30 border-t">
                    <div className="container mx-auto max-w-6xl">
                        <div className="text-center mb-16">
                            <h3 className="text-3xl font-bold tracking-tight mb-4">Everything you need to excel</h3>
                            <p className="text-muted-foreground text-lg">Powerful tools wrapped in a beautiful, distraction-free interface.</p>
                        </div>
                        
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    icon: Users,
                                    title: "Study Groups",
                                    desc: "Connect with peers, share progress, and stay accountable in real-time.",
                                    color: "text-blue-500",
                                    bg: "bg-blue-500/10"
                                },
                                {
                                    icon: Timer,
                                    title: "Focus Timer",
                                    desc: "Track your deep work sessions and visualize your daily progress effortlessly.",
                                    color: "text-green-500",
                                    bg: "bg-green-500/10"
                                },
                                {
                                    icon: Trophy,
                                    title: "Leaderboards",
                                    desc: "Compete on consistency and effort with friendly gamification.",
                                    color: "text-orange-500",
                                    bg: "bg-orange-500/10"
                                },
                                {
                                    icon: BookOpen,
                                    title: "Productivity Stats",
                                    desc: "Get deep insights into your study habits and maintain your daily streaks.",
                                    color: "text-purple-500",
                                    bg: "bg-purple-500/10"
                                }
                            ].map((feature, i) => (
                                <Card key={i} className="border-none shadow-lg bg-background/50 backdrop-blur-sm transition-all hover:-translate-y-2 hover:shadow-xl group">
                                    <CardHeader>
                                        <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                            <feature.icon className={`w-7 h-7 ${feature.color}`} />
                                        </div>
                                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {feature.desc}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
