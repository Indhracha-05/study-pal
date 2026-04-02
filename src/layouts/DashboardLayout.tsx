import { Outlet } from "react-router-dom"
import { DashboardSidebar } from "@/components/DashboardSidebar"

export default function DashboardLayout() {
    return (
        <div className="flex min-h-screen">
            <DashboardSidebar />
            <main className="flex-1 p-8 transition-all duration-500 ease-in-out">
                <Outlet />
            </main>
        </div>
    )
}
