import { Outlet } from "react-router-dom"
import { DashboardSidebar } from "@/components/DashboardSidebar"

export default function DashboardLayout() {
    return (
        <div className="flex min-h-screen">
            <DashboardSidebar />
            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    )
}
