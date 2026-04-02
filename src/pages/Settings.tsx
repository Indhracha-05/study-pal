import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTimer } from "@/contexts/TimerContext"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Save, User, Zap, Mail, ChevronDown, ChevronUp, Palette, Bell, Volume2, Monitor, Target } from "lucide-react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function Settings() {
    const { 
        focusLength, 
        shortBreakLength, 
        longBreakLength, 
        autoStartBreaks,
        autoStartFocus,
        updateTimerSettings,
        // System Configs
        particleDensity: globalDensity,
        adaptiveHUD: globalHUD,
        glowIntensity: globalGlow,
        isMuted: globalMute,
        notificationsEnabled: globalNotify,
        dailyGoal: globalDailyGoal,
        updateSystemConfigs
    } = useTimer()
    
    const { currentUser } = useAuth()
    
    const [tempFocus, setTempFocus] = useState<number | string>(focusLength)
    const [tempShort, setTempShort] = useState<number | string>(shortBreakLength)
    const [tempLong, setTempLong] = useState<number | string>(longBreakLength)
    const [tempAutoBreak, setTempAutoBreak] = useState(autoStartBreaks)
    const [tempAutoFocus, setTempAutoFocus] = useState(autoStartFocus)
    
    // Profile state
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [isSavingProfile, setIsSavingProfile] = useState(false)

    // Accordion State
    const [openCategory, setOpenCategory] = useState<"USER" | "SYSTEM" | "VISUALS" | "ALERTS" | null>("SYSTEM")

    const focusPresets = [15, 25, 45, 60, 90]
    const shortPresets = [5, 10, 15]
    const longPresets = [15, 20, 30]

    useEffect(() => {
        const fetchProfile = async () => {
            if (currentUser) {
                const docRef = doc(db, "users", currentUser.uid)
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    const data = docSnap.data()
                    setFirstName(data.firstName || "")
                    setLastName(data.lastName || "")
                }
            }
        }
        fetchProfile()
    }, [currentUser])

    const handleTimerSave = () => {
        const focus = Number(tempFocus)
        const short = Number(tempShort)
        const long = Number(tempLong)

        if (isNaN(focus) || isNaN(short) || isNaN(long) || focus <= 0) {
            toast.error("Telemetry error: Invalid numeric data detected.")
            return
        }

        updateTimerSettings(focus, short, long, tempAutoBreak, tempAutoFocus)
        toast.success("System protocols updated! 🛰️")
    }

    const handleConfigUpdate = (updates: { density?: number, hud?: boolean, glow?: number, mute?: boolean, notify?: boolean, goal?: number }) => {
        updateSystemConfigs(
            updates.density ?? globalDensity,
            updates.hud ?? globalHUD,
            updates.glow ?? globalGlow,
            updates.mute ?? globalMute,
            updates.notify ?? globalNotify,
            updates.goal ?? globalDailyGoal
        )
    }

    const handleProfileSave = async () => {
        if (!currentUser) return
        setIsSavingProfile(true)
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                firstName,
                lastName
            })
            toast.success("Profile credentials updated! 🏆")
        } catch (error) {
            console.error("Failed to update profile:", error)
            toast.error("Failed to update profile telemetry.")
        } finally {
            setIsSavingProfile(false)
        }
    }

    const toggleAccordion = (cat: "USER" | "SYSTEM" | "VISUALS" | "ALERTS") => {
        setOpenCategory(openCategory === cat ? null : cat)
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-4xl mx-auto">
            <div>
                <h1 className="text-4xl font-black font-heading tracking-tight text-slate-900 dark:text-white">Console Settings</h1>
                <p className="text-muted-foreground mt-1 font-medium">Configure your personal scholar operative console.</p>
            </div>

            <div className="space-y-6">
                {/* User Details Drop Down */}
                <div className="group">
                    <button 
                        onClick={() => toggleAccordion("USER")}
                        className={cn(
                            "w-full flex items-center justify-between p-6 rounded-2xl transition-all duration-300",
                            openCategory === "USER" 
                                ? "bg-primary/10 border-b-0 rounded-b-none" 
                                : "bg-primary/[0.03] hover:bg-primary/[0.06] rounded-2xl border border-slate-200 dark:border-white/5"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
                                <User className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">User Details</h2>
                                <p className="text-[10px] text-muted-foreground font-bold">IDENTITY & CREDENTIALS</p>
                            </div>
                        </div>
                        {openCategory === "USER" ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    
                    {openCategory === "USER" && (
                        <div className="p-6 bg-primary/[0.03] border-x border-b border-primary/20 rounded-b-2xl animate-in slide-in-from-top-2 duration-300">
                            <div className="space-y-8 max-w-2xl">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Email Identification</Label>
                                        <div className="flex items-center gap-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-slate-400 dark:text-white/40 cursor-not-allowed">
                                            <Mail className="h-4 w-4" />
                                            <span className="font-bold text-sm">{currentUser?.email}</span>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">First Name</Label>
                                            <Input 
                                                className="bg-white dark:bg-black/60 border-slate-200 dark:border-white/10 font-bold h-12 focus:ring-primary focus:border-primary/50"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="Enter first name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Last Name</Label>
                                            <Input 
                                                className="bg-white dark:bg-black/60 border-slate-200 dark:border-white/10 font-bold h-12 focus:ring-primary focus:border-primary/50"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    className="px-10 font-black tracking-widest glow-btn h-12" 
                                    onClick={handleProfileSave}
                                    disabled={isSavingProfile}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {isSavingProfile ? "UPDATING..." : "SAVE CHANGES"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* System Config Drop Down */}
                <div className="group">
                    <button 
                        onClick={() => toggleAccordion("SYSTEM")}
                        className={cn(
                            "w-full flex items-center justify-between p-6 rounded-2xl transition-all duration-300",
                            openCategory === "SYSTEM" 
                                ? "bg-indigo-500/10 border-b-0 rounded-b-none" 
                                : "bg-indigo-500/[0.03] hover:bg-indigo-500/[0.06] rounded-2xl border border-slate-200 dark:border-white/5"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                                <Zap className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">System Config</h2>
                                <p className="text-[10px] text-muted-foreground font-bold">TIMER & INTERFACE PROTOCOLS</p>
                            </div>
                        </div>
                        {openCategory === "SYSTEM" ? <ChevronUp className="h-5 w-5 text-indigo-400" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    
                    {openCategory === "SYSTEM" && (
                        <div className="p-6 bg-indigo-500/[0.03] border-x border-b border-indigo-500/20 rounded-b-2xl animate-in slide-in-from-top-2 duration-300">
                            <div className="space-y-10">
                                {/* Auto-Start Automation */}
                                <div className="grid sm:grid-cols-2 gap-6 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Auto-Start Breaks</Label>
                                            <p className="text-[10px] text-muted-foreground font-bold leading-tight">CONTINUE TO BREAK AFTER FOCUS</p>
                                        </div>
                                        <button 
                                            onClick={() => setTempAutoBreak(!tempAutoBreak)}
                                            className={cn(
                                                "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                                tempAutoBreak ? "bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)]" : "bg-slate-200 dark:bg-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full bg-white transition-all duration-300",
                                                tempAutoBreak ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 border-l border-slate-200 dark:border-white/5 pl-6 sm:border-l sm:pl-6 border-transparent">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Auto-Start Focus</Label>
                                            <p className="text-[10px] text-muted-foreground font-bold leading-tight">START NEXT ROUND AFTER BREAK</p>
                                        </div>
                                        <button 
                                            onClick={() => setTempAutoFocus(!tempAutoFocus)}
                                            className={cn(
                                                "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                                tempAutoFocus ? "bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)]" : "bg-slate-200 dark:bg-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full bg-white transition-all duration-300",
                                                tempAutoFocus ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                </div>

                                {/* Focus Time List */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Focus Intensity Presets</Label>
                                        <span className="text-[10px] font-black text-indigo-400">{tempFocus} MINUTES ACTIVE</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {focusPresets.map((time) => (
                                            <button
                                                key={time}
                                                onClick={() => setTempFocus(time)}
                                                className={cn(
                                                    "px-6 py-3 rounded-xl text-sm font-black transition-all border",
                                                    Number(tempFocus) === time 
                                                        ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/30" 
                                                        : "bg-white dark:bg-black/60 text-slate-500 dark:text-muted-foreground border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
                                                )}
                                            >
                                                {time}m
                                            </button>
                                        ))}
                                        <div className="flex items-center gap-3 ml-auto bg-white dark:bg-black/40 p-2 rounded-xl border border-slate-200 dark:border-white/5">
                                            <span className="text-[10px] font-black text-muted-foreground/40">CUSTOM</span>
                                            <Input 
                                                type="number" 
                                                className="w-20 h-10 bg-white dark:bg-black/60 border-slate-200 dark:border-white/10 text-center font-black text-sm focus:ring-indigo-500"
                                                value={tempFocus}
                                                onChange={(e) => setTempFocus(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Break Times */}
                                <div className="grid md:grid-cols-2 gap-12">
                                    <div className="space-y-5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 dark:text-emerald-400/60">Short Break Presets</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {shortPresets.map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => setTempShort(time)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-xs font-black transition-all border",
                                                        Number(tempShort) === time 
                                                            ? "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/10" 
                                                            : "bg-white dark:bg-black/60 text-slate-500 dark:text-muted-foreground border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
                                                    )}
                                                >
                                                    {time}m
                                                </button>
                                            ))}
                                            <Input 
                                                type="number" 
                                                className="w-16 h-10 bg-white dark:bg-black/40 border-slate-200 dark:border-white/5 font-black text-center text-xs ml-auto"
                                                value={tempShort}
                                                onChange={(e) => setTempShort(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 dark:text-amber-400/60">Long Break Presets</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {longPresets.map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => setTempLong(time)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-xs font-black transition-all border",
                                                        Number(tempLong) === time 
                                                            ? "bg-orange-500/20 text-orange-500 dark:text-amber-400 border-orange-500/50 shadow-lg shadow-orange-500/10" 
                                                            : "bg-white dark:bg-black/60 text-slate-500 dark:text-muted-foreground border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
                                                    )}
                                                >
                                                    {time}m
                                                </button>
                                            ))}
                                            <Input 
                                                type="number" 
                                                className="w-16 h-10 bg-white dark:bg-black/40 border-slate-200 dark:border-white/5 font-black text-center text-xs ml-auto"
                                                value={tempLong}
                                                onChange={(e) => setTempLong(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Study Goal */}
                                <div className="space-y-4 p-5 bg-white dark:bg-black/40 border border-indigo-500/10 rounded-2xl shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                            <Target className="h-3.5 w-3.5 text-indigo-400" />
                                            Daily Study Goal
                                        </Label>
                                        <span className="text-sm font-black text-indigo-400">{globalDailyGoal}h</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="12"
                                        step="0.5"
                                        className="w-full accent-indigo-500 bg-slate-100 dark:bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                                        value={globalDailyGoal}
                                        onChange={(e) => handleConfigUpdate({ goal: Number(e.target.value) })}
                                    />
                                    <div className="flex justify-between text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">
                                        <span>1h</span><span>6h</span><span>12h</span>
                                    </div>
                                </div>

                                <Button 
                                    className="w-full font-black tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.2)] h-14 rounded-2xl text-lg" 
                                    onClick={handleTimerSave}
                                >
                                    <Save className="mr-2 h-5 w-5" />
                                    SAVE SYSTEM PREFERENCES
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Visual Protocols Drop Down */}
                <div className="group">
                    <button 
                        onClick={() => toggleAccordion("VISUALS")}
                        className={cn(
                            "w-full flex items-center justify-between p-6 rounded-2xl transition-all duration-300",
                            openCategory === "VISUALS" 
                                ? "bg-pink-500/10 border-b-0 rounded-b-none" 
                                : "bg-pink-500/[0.03] hover:bg-pink-500/[0.06] rounded-2xl border border-slate-200 dark:border-white/5"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400">
                                <Palette className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Visual Protocols</h2>
                                <p className="text-[10px] text-muted-foreground font-bold">THEMES & INTERFACE AESTHETICS</p>
                            </div>
                        </div>
                        {openCategory === "VISUALS" ? <ChevronUp className="h-5 w-5 text-pink-400" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    
                    {openCategory === "VISUALS" && (
                        <div className="p-10 bg-pink-500/[0.03] border-x border-b border-pink-500/20 rounded-b-2xl animate-in slide-in-from-top-2 duration-300">
                            <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-5 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Interface Theme</Label>
                                            <p className="text-[10px] text-muted-foreground font-bold">SWITCH LIGHT/DARK OPS</p>
                                        </div>
                                        <div className="scale-125 origin-right">
                                            <ThemeToggle />
                                        </div>
                                    </div>

                                    <div className="space-y-4 p-5 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                                Particle Density
                                                <span className="text-[8px] opacity-40">(HOMEPAGE ONLY)</span>
                                            </Label>
                                            <span className="text-[10px] font-black text-pink-400">{globalDensity}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            className="w-full accent-pink-500 bg-slate-100 dark:bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                                            value={globalDensity}
                                            onChange={(e) => handleConfigUpdate({ density: Number(e.target.value) })}
                                        />
                                        <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tighter text-right">Atmospheric Intensity Level</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div 
                                        className={cn(
                                            "flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer group",
                                            globalHUD ? "bg-pink-500/10 border-pink-500/30" : "bg-white dark:bg-black/20 border-slate-200 dark:border-white/5"
                                        )}
                                        onClick={() => handleConfigUpdate({ hud: !globalHUD })}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn("p-2 rounded-xl transition-colors", globalHUD ? "bg-pink-500/20 text-pink-400" : "bg-slate-100 dark:bg-white/5 text-slate-400")}>
                                                <Monitor className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-black text-slate-900 dark:text-white uppercase cursor-pointer">Adaptive HUD</Label>
                                                <p className="text-[10px] text-muted-foreground/40 font-bold">EXPERIMENTAL PROTOCOL</p>
                                            </div>
                                        </div>
                                        <div className={cn("h-4 w-4 rounded-full border-2 transition-all", globalHUD ? "bg-pink-500 border-pink-400 scale-110" : "border-slate-300 dark:border-white/10")} />
                                    </div>

                                    <div className="space-y-4 p-5 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Zap className="h-3 w-3 text-pink-500" />
                                                <Label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Glow Intensity</Label>
                                            </div>
                                            <span className="text-[10px] font-black text-pink-400">{globalGlow.toFixed(1)}x</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="2" 
                                            step="0.1"
                                            className="w-full accent-pink-500 bg-slate-100 dark:bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                                            value={globalGlow}
                                            onChange={(e) => handleConfigUpdate({ glow: Number(e.target.value) })}
                                        />
                                        <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tighter text-right">Hardware Illumination Level</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Alert Protocols Drop Down */}
                <div className="group">
                    <button 
                        onClick={() => toggleAccordion("ALERTS")}
                        className={cn(
                            "w-full flex items-center justify-between p-6 rounded-2xl transition-all duration-300",
                            openCategory === "ALERTS" 
                                ? "bg-amber-500/10 border-b-0 rounded-b-none" 
                                : "bg-amber-500/[0.03] hover:bg-amber-500/[0.06] rounded-2xl border border-slate-200 dark:border-white/5"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                                <Bell className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Alert Protocols</h2>
                                <p className="text-[10px] text-muted-foreground font-bold">NOTIFICATIONS & AUDIO OPS</p>
                            </div>
                        </div>
                        {openCategory === "ALERTS" ? <ChevronUp className="h-5 w-5 text-amber-400" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    
                    {openCategory === "ALERTS" && (
                        <div className="p-10 bg-amber-500/[0.03] border-x border-b border-amber-500/20 rounded-b-2xl animate-in slide-in-from-top-2 duration-300">
                            <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-5 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Desktop Notifications</Label>
                                            <p className="text-[10px] text-muted-foreground font-bold leading-tight">BROWSER LEVEL TELEMETRY</p>
                                        </div>
                                        <button 
                                            onClick={() => handleConfigUpdate({ notify: !globalNotify })}
                                            className={cn(
                                                "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                                globalNotify ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "bg-slate-200 dark:bg-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full bg-white transition-all duration-300",
                                                globalNotify ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-5 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Volume2 className="h-3 w-3 text-amber-400" />
                                                <Label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Audio Mute</Label>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-bold leading-tight">SILENCE ALL SESSION CHIMES</p>
                                        </div>
                                        <button 
                                            onClick={() => handleConfigUpdate({ mute: !globalMute })}
                                            className={cn(
                                                "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                                globalMute ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "bg-slate-200 dark:bg-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full bg-white transition-all duration-300",
                                                globalMute ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center space-y-4 p-8 bg-white dark:bg-black/40 border-l-2 border-amber-500/30 rounded-2xl shadow-sm">
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                        <Zap className="h-3 w-3 text-amber-500" />
                                        Transmission Tip
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic">
                                        "Automated desktop notifications ensure you never miss a mission transition. Keep them enabled for maximum tactical advantage."
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
