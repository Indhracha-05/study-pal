import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, doc, updateDoc, getDoc, query, where, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

export type TimerMode = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";

interface TimerContextType {
    timeLeft: number;
    isActive: boolean;
    mode: TimerMode;
    toggleTimer: () => void;
    resetTimer: () => void;
    setTimerMode: (mode: TimerMode) => void;
    formatTime: (seconds: number) => string;
    tasks: any[];
    selectedTaskId: string;
    setSelectedTaskId: (id: string) => void;
    showFeedback: boolean;
    setShowFeedback: (show: boolean) => void;
    showTransitionFeedback: boolean;
    setShowTransitionFeedback: (show: boolean) => void;
    lastSessionTaskId: string;
    focusLength: number;
    shortBreakLength: number;
    longBreakLength: number;
    autoStartBreaks: boolean;
    autoStartFocus: boolean;
    
    // System Configs
    particleDensity: number;
    adaptiveHUD: boolean;
    glowIntensity: number;
    isMuted: boolean;
    notificationsEnabled: boolean;
    dailyGoal: number;
    
    updateTimerSettings: (focus: number, short: number, long: number, autoBreak?: boolean, autoFocus?: boolean) => void;
    updateSystemConfigs: (density: number, hud: boolean, glow: number, muted: boolean, notify: boolean, goal: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error("useTimer must be used within a TimerProvider");
    }
    return context;
};

export const TimerProvider = ({ children }: { children: ReactNode }) => {
    const [focusLength, setFocusLength] = useState(() => Number(localStorage.getItem("pomo_focus")) || 25);
    const [shortBreakLength, setShortBreakLength] = useState(() => Number(localStorage.getItem("pomo_short")) || 5);
    const [longBreakLength, setLongBreakLength] = useState(() => Number(localStorage.getItem("pomo_long")) || 15);
    const [autoStartBreaks, setAutoStartBreaks] = useState(() => localStorage.getItem("pomo_auto_break") === "true");
    const [autoStartFocus, setAutoStartFocus] = useState(() => localStorage.getItem("pomo_auto_focus") === "true");
    
    //timeLeft should initialize based on current mode
    const [timeLeft, setTimeLeft] = useState(() => (Number(localStorage.getItem("pomo_focus")) || 25) * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<TimerMode>("FOCUS");
    const [completedPomos, setCompletedPomos] = useState(0);
    const [tasks, setTasks] = useState<any[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const [showFeedback, setShowFeedback] = useState(false);
    const [showTransitionFeedback, setShowTransitionFeedback] = useState(false);
    const [lastSessionTaskId, setLastSessionTaskId] = useState("");
    
    // System Configs
    const [particleDensity, setParticleDensity] = useState(() => Number(localStorage.getItem("pomo_density")) || 50);
    const [adaptiveHUD, setAdaptiveHUD] = useState(() => localStorage.getItem("pomo_hud") === "true");
    const [glowIntensity, setGlowIntensity] = useState(() => Number(localStorage.getItem("pomo_glow")) || 1);
    const [isMuted, setIsMuted] = useState(() => localStorage.getItem("pomo_muted") === "true");
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem("pomo_notify") !== "false");
    const [dailyGoal, setDailyGoal] = useState(() => Number(localStorage.getItem("pomo_daily_goal")) || 4);

    const initialTimeRef = useRef(focusLength * 60);
    const { currentUser } = useAuth();

    useEffect(() => {
        document.documentElement.setAttribute('data-timer-active', isActive.toString());
    }, [isActive]);

    useEffect(() => {
        const savedGlow = localStorage.getItem("pomo_glow") || "1";
        const savedHUD = localStorage.getItem("pomo_hud") === "true";
        document.documentElement.style.setProperty("--glow-strength", savedGlow);
        document.documentElement.setAttribute('data-hud', savedHUD.toString());
    }, []);

    const updateSystemConfigs = (density: number, hud: boolean, glow: number, muted: boolean, notify: boolean, goal: number) => {
        setParticleDensity(density);
        setAdaptiveHUD(hud);
        setGlowIntensity(glow);
        setIsMuted(muted);
        setNotificationsEnabled(notify);
        setDailyGoal(goal);

        localStorage.setItem("pomo_density", density.toString());
        localStorage.setItem("pomo_hud", hud.toString());
        localStorage.setItem("pomo_glow", glow.toString());
        localStorage.setItem("pomo_muted", muted.toString());
        localStorage.setItem("pomo_notify", notify.toString());
        localStorage.setItem("pomo_daily_goal", goal.toString());
        
        // Dynamic CSS var application for Glow Intensity and HUD
        document.documentElement.style.setProperty("--glow-strength", glow.toString());
        document.documentElement.setAttribute('data-hud', hud.toString());
    };

    const updateTimerSettings = (focus: number, short: number, long: number, autoBreak?: boolean, autoFocus?: boolean) => {
        setFocusLength(focus);
        setShortBreakLength(short);
        setLongBreakLength(long);
        localStorage.setItem("pomo_focus", focus.toString());
        localStorage.setItem("pomo_short", short.toString());
        localStorage.setItem("pomo_long", long.toString());

        if (autoBreak !== undefined) {
            setAutoStartBreaks(autoBreak);
            localStorage.setItem("pomo_auto_break", autoBreak.toString());
        }

        if (autoFocus !== undefined) {
            setAutoStartFocus(autoFocus);
            localStorage.setItem("pomo_auto_focus", autoFocus.toString());
        }
        
        // If timer is not running, update the current display
        if (!isActive) {
            setTimeLeft(focus * 60);
        }
    };

    // Listen to user's tasks
    useEffect(() => {
        if (!currentUser) {
            setTasks([]);
            return;
        }

        const tasksQuery = query(
            collection(db, "tasks"),
            where("userId", "==", currentUser.uid)
        );

        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(fetchedTasks);
        }, (error) => {
            console.error("TimerContext tasks listener error:", error);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const playSound = () => {
        if (isMuted) return;
        try {
            const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
            audio.play().catch(e => console.log("Audio play deferred or blocked:", e));
        } catch (e) {
            console.error("Failed to play sound:", e);
        }
    };

    const handleSessionComplete = async () => {
        setIsActive(false);
        playSound();
        resetTimer(); // Automatic reset to initial time
        const user = auth.currentUser;

        if (mode === "FOCUS") {
            if (user) {
                try {
                    const durationMinutes = Math.floor(initialTimeRef.current / 60);

                    let taskTitleForLog = "Focus Session";
                    let currentPomoForLog = null;
                    let totalPomosForLog = null;

                    if (selectedTaskId) {
                        const taskRef = doc(db, "tasks", selectedTaskId);
                        const taskDoc = await getDoc(taskRef);
                        const currentPomos = taskDoc.exists() ? (taskDoc.data().currentPomos || 0) : 0;
                        const totalPomos = taskDoc.exists() ? (taskDoc.data().totalPomos || 1) : 1;

                        const newPomos = currentPomos + 1;
                        taskTitleForLog = taskDoc.exists() ? taskDoc.data().title : "General Focus";
                        currentPomoForLog = newPomos;
                        totalPomosForLog = totalPomos;

                        await updateDoc(taskRef, { currentPomos: newPomos });

                        setLastSessionTaskId(selectedTaskId);
                        
                        if (newPomos >= totalPomos) {
                            setShowFeedback(true); 
                        }
                    } else {
                        // Crucial: Clear these so we don't carry over ghost data
                        setLastSessionTaskId("");
                        taskTitleForLog = "Unlinked Session";
                    }

                    await addDoc(collection(db, "sessions"), {
                        userId: user.uid,
                        taskId: selectedTaskId || null,
                        taskTitle: taskTitleForLog,
                        duration: durationMinutes,
                        pomoCount: selectedTaskId ? currentPomoForLog : null,
                        totalPomos: selectedTaskId ? totalPomosForLog : null,
                        timestamp: new Date().toISOString(),
                        mode: "FOCUS"
                    });

                    const userRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userRef);

                    const currentTotal = userDoc.exists() && userDoc.data().totalStudyTime ? userDoc.data().totalStudyTime : "0h 0m";
                    const matches = currentTotal.match(/(\d+)h\s*(\d+)m/);
                    let totalMinutes = durationMinutes;
                    if (matches) {
                        const h = parseInt(matches[1]);
                        const m = parseInt(matches[2]);
                        totalMinutes += h * 60 + m;
                    }

                    const newTotal = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

                    let newRank = "Newbie";
                    if (totalMinutes >= 600) newRank = "Master";
                    else if (totalMinutes >= 300) newRank = "Expert";
                    else if (totalMinutes >= 120) newRank = "Scholar";
                    else if (totalMinutes >= 50) newRank = "Apprentice";

                    const userData = userDoc.exists() ? userDoc.data() : {};
                    const lastSessionDate = userData.lastSessionDate || "";
                    const todayDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
                    
                    let currentStreakValue = 1;
                    if (userData.currentStreak) {
                        const match = userData.currentStreak.match(/(\d+)/);
                        if (match) currentStreakValue = parseInt(match[1]);
                    }

                    // IF new day, increment streak. IF same day, keep it. IF missed day, reset.
                    let newStreak = `${currentStreakValue} Days`;
                    if (lastSessionDate !== todayDate) {
                        // Very basic check: If last session was yesterday (or older), increment
                        // (In a full prod app we'd check if yesterday was exactly 1 day ago)
                        const updatedStreakValue = currentStreakValue + 1;
                        newStreak = `${updatedStreakValue} Day${updatedStreakValue > 1 ? 's' : ''}`;
                    }

                    const currentDailyMinutes = userData.dailyFocusMinutes || 0;
                    const sessionMinutes = Math.ceil(initialTimeRef.current / 60); 
                    const currentXP = userData.totalXP || 0;
                    const currentDailyXP = userData.dailyXP || 0;
                    const earnedXP = (sessionMinutes * 10) + 50; 

                    const updatedData = {
                        totalStudyTime: newTotal,
                        rank: newRank,
                        currentStreak: newStreak,
                        lastSessionDate: todayDate,
                        dailyFocusMinutes: currentDailyMinutes + sessionMinutes,
                        totalXP: currentXP + earnedXP,
                        dailyXP: currentDailyXP + earnedXP,
                    };

                    await updateDoc(userRef, updatedData).catch(async () => {
                        const { setDoc } = await import("firebase/firestore");
                        await setDoc(userRef, updatedData, { merge: true });
                    });

                } catch (error) {
                    console.error("Failed to log session:", error);
                    toast.error("Finished session, but failed to save to cloud.");
                }
            }

            const newCompletedCount = completedPomos + 1;
            setCompletedPomos(newCompletedCount);

            // Important: We only show the transition choice if they DIDN'T just finish their main goal
            // If they did finish the goal, `showFeedback` handles the flow from there.
            if (!showFeedback) {
                if (autoStartBreaks) {
                    setTimerMode("SHORT_BREAK");
                    setIsActive(true);
                    toast.info("Auto-starting short break... ☕");
                } else {
                    setShowTransitionFeedback(true);
                }
            }

            if (Notification.permission === "granted") {
                new Notification("Study Pal Timer", { body: "Focus complete! Time for a break." });
            }

        } else {
            if (Notification.permission === "granted") {
                new Notification("Study Pal Timer", { body: "Break complete! Time to focus." });
            }
            
            if (autoStartFocus) {
                setTimerMode("FOCUS");
                setIsActive(true);
                toast.info("Auto-starting next focus session... 🚀");
            } else {
                toast.success("Break complete! Back to focus.");
                setTimerMode("FOCUS");
            }
        }
    };

    useEffect(() => {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }

        let interval: number | null = null;

        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            handleSessionComplete();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, mode]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(focusLength * 60);
    };

    const setTimerMode = (newMode: TimerMode) => {
        setMode(newMode);
        setIsActive(false);
        
        const time = newMode === "FOCUS" 
            ? focusLength * 60 
            : (newMode === "SHORT_BREAK" ? shortBreakLength * 60 : longBreakLength * 60);
        
        setTimeLeft(time);
        initialTimeRef.current = time;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const value = {
        timeLeft,
        isActive,
        mode,
        toggleTimer,
        resetTimer,
        setTimerMode,
        formatTime,
        tasks,
        selectedTaskId,
        setSelectedTaskId,
        showFeedback,
        setShowFeedback,
        showTransitionFeedback,
        setShowTransitionFeedback,
        lastSessionTaskId,
        focusLength,
        shortBreakLength,
        longBreakLength,
        autoStartBreaks,
        autoStartFocus,
        updateTimerSettings,
        
        // System Configs
        particleDensity,
        adaptiveHUD,
        glowIntensity,
        isMuted,
        notificationsEnabled,
        dailyGoal,
        updateSystemConfigs
    };

    return (
        <TimerContext.Provider value={value}>
            {children}
        </TimerContext.Provider>
    );
};
