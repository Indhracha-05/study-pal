import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // While Firebase is restoring auth state from IndexedDB, show a loading spinner.
    // This is crucial — without this, we'd redirect to /login on every reload
    // during the brief moment before onAuthStateChanged fires.
    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-muted/20">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-md" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading study space...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
