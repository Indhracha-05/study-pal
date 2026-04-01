import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { toast } from "sonner"

export default function Settings() {
    const { currentUser } = useAuth()
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return
            try {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid))
                if (userDoc.exists()) {
                    const data = userDoc.data()
                    setFirstName(data.firstName || "")
                    setLastName(data.lastName || "")
                }
            } catch (error) {
                console.error("Error fetching user data:", error)
                toast.error("Failed to load profile data")
            } finally {
                setLoading(false)
            }
        }
        fetchUserData()
    }, [currentUser])

    const handleSave = async () => {
        if (!currentUser) return
        setSaving(true)
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                firstName,
                lastName
            })
            toast.success("Profile updated successfully")
        } catch (error) {
            console.error("Error updating profile:", error)
            toast.error("Failed to update profile")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading profile...</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input 
                                        id="firstName" 
                                        value={firstName} 
                                        onChange={(e) => setFirstName(e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input 
                                        id="lastName" 
                                        value={lastName} 
                                        onChange={(e) => setLastName(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={currentUser?.email || ""} disabled />
                            </div>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize how Study Pal looks for you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">You can toggle between light and dark mode using the theme switch on the home page or sidebar.</p>
                </CardContent>
            </Card>
        </div>
    )
}
