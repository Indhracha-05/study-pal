import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Users, LayoutDashboard, Trophy, Timer, Settings, LogOut, Calendar, Brain, BarChart3 } from "lucide-react"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Groups", href: "/dashboard/groups" },
    { icon: Timer, label: "Focus Timer", href: "/dashboard/sessions" },
    { icon: BarChart3, label: "Study Intel", href: "/dashboard/reports" },
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
        <div className="flex h-screen w-72 shrink-0 flex-col glass-sidebar m-0 border-r border-border">
            <div className="p-10">
                <Link to="/" className="hover:opacity-80 transition-opacity flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary shadow-lg shadow-primary/40 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight gradient-text font-heading uppercase text-[15px] tracking-widest leading-none">Study Pal</h2>
                </Link>
            </div>
            <div className="flex-1 px-4 overflow-auto">
                <div className="space-y-2">
                    {sidebarItems.map((item) => (
                        <div key={item.href} className="px-3">
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start transition-all group rounded-xl mb-1", 
                                    pathname === item.href 
                                        ? "nav-link-active text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary shadow-sm shadow-primary/10" 
                                        : "hover:bg-slate-100 dark:hover:bg-white/5 pl-4"
                                )}
                                asChild
                            >
                                <Link to={item.href}>
                                    <item.icon className={cn("mr-4 h-5 w-5 transition-transform group-hover:scale-110", pathname === item.href ? "text-primary" : "text-muted-foreground/60")} />
                                    <span className={cn(
                                        "tracking-[0.05em] text-sm uppercase font-bold text-[11px]",
                                        pathname === item.href ? "text-primary" : "text-muted-foreground/80"
                                    )}>
                                        {item.label}
                                    </span>
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="px-6 pt-5 pb-7 border-t border-border flex flex-col gap-2">
                {/* Theme Row */}
                <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-muted/30 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Theme</span>
                    <ThemeToggle />
                </div>

                {/* Settings */}
                <Button variant="ghost" className="w-full justify-start group hover:bg-primary/5 h-11" asChild>
                    <Link to="/dashboard/settings">
                        <Settings className="mr-3 h-4 w-4 text-muted-foreground group-hover:rotate-45 transition-transform" />
                        <span className="text-sm tracking-wide">Settings</span>
                    </Link>
                </Button>

                {/* Logout */}
                <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive/70 hover:text-destructive hover:bg-destructive/10 group h-11"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-bold tracking-wide">Log Out</span>
                </Button>
            </div>
        </div>
    )
}
