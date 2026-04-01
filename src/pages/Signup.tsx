import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router-dom"
import { auth, db } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { toast } from "sonner"

export default function Signup() {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Save user profile to Firestore
            await setDoc(doc(db, "users", user.uid), {
                firstName,
                lastName,
                email,
                totalStudyTime: "0h 0m",
                currentStreak: "0 Days",
                rank: "Newbie",
                createdAt: new Date().toISOString()
            })

            toast.success("Account created successfully!")
            navigate("/dashboard")
        } catch (error: any) {
            toast.error(error.message || "Failed to create account")
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
                    <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                    <CardDescription>
                        Enter your email below to create your study space
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first-name">First name</Label>
                                <Input
                                    id="first-name"
                                    placeholder="John"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last-name">Last name</Label>
                                <Input
                                    id="last-name"
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
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
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Creating account..." : "Get Started"}
                        </Button>
                    </form>
                    <div className="text-center text-sm mt-4">
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            Log in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
