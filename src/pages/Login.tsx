import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router-dom"
import { auth } from "@/lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { toast } from "sonner"
export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await signInWithEmailAndPassword(auth, email, password)
            toast.success("Welcome back!")
            navigate("/dashboard")
        } catch (error: any) {
            toast.error(error.message || "Failed to log in")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4 relative">
            <div className="absolute top-4 left-4">
                <Link to="/" className="text-sm font-medium hover:underline flex items-center gap-2">
                    &larr; Back to Home
                </Link>
            </div>
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        Enter your credentials to access your study space
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link to="#" className="text-sm text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Logging in..." : "Log In"}
                        </Button>
                    </form>
                    <div className="text-center text-sm mt-4">
                        Don't have an account?{" "}
                        <Link to="/signup" className="text-primary hover:underline font-medium">
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
