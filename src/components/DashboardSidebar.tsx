import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Users, LayoutDashboard, Trophy, Timer, Settings, LogOut } from "lucide-react"

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Groups", href: "/dashboard/groups" },
    { icon: Timer, label: "Sessions", href: "/dashboard/sessions" },
    { icon: Trophy, label: "Leaderboard", href: "/dashboard/leaderboard" },
]

export function DashboardSidebar() {
    const location = useLocation()
    const pathname = location.pathname

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-background">
            <div className="p-6">
                <h2 className="text-xl font-bold tracking-tight">Study Pal</h2>
            </div>
            <div className="flex-1 px-4 overflow-auto">
                <div className="space-y-2">
                    {sidebarItems.map((item) => (
                        <Button
                            key={item.href}
                            variant={pathname === item.href ? "secondary" : "ghost"}
                            className={cn("w-full justify-start", pathname === item.href && "bg-secondary")}
                            asChild
                        >
                            <Link to={item.href}>
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </Link>
                        </Button>
                    ))}
                </div>
            </div>
            <div className="p-4 border-t space-y-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                </Button>
            </div>
        </div>
    )
}
