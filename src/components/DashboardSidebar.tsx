import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Users, LayoutDashboard, Trophy, Timer, Settings, LogOut, Calendar } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Groups", href: "/dashboard/groups" },
    { icon: Timer, label: "Sessions", href: "/dashboard/sessions" },
    { icon: Calendar, label: "Calendar", href: "/dashboard/calendar" },
    { icon: Trophy, label: "Leaderboard", href: "/dashboard/leaderboard" },
]

export function DashboardSidebar() {
    const location = useLocation()
    const navigate = useNavigate()
    const pathname = location.pathname

    const handleLogout = async () => {
        try {
            await auth.signOut()
            toast.success("Logged out successfully")
            navigate("/")
        } catch (error: any) {
            toast.error("Failed to log out")
        }
    }

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-background">
            <div className="p-6">
                <Link to="/" className="hover:opacity-80 transition-opacity">
                    <h2 className="text-xl font-bold tracking-tight">Study Pal</h2>
                </Link>
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
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Theme</span>
                    <ThemeToggle />
                </div>
                <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                </Button>
            </div>
        </div>
    )
}
