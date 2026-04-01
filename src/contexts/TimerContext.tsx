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
    topic: string;
    setTopic: (topic: string) => void;
    toggleTimer: () => void;
    resetTimer: () => void;
    setTimerMode: (newMode: TimerMode) => void;
    formatTime: (seconds: number) => string;
    tasks: any[];
    selectedTaskId: string;
    setSelectedTaskId: (id: string) => void;
    showFeedback: boolean;
    setShowFeedback: (show: boolean) => void;
    lastSessionTaskId: string;
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
    const [timeLeft, setTimeLeft] = useState(3);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<TimerMode>("FOCUS");
    const [topic, setTopic] = useState("General Study");
    const [completedPomos, setCompletedPomos] = useState(0);
    const [tasks, setTasks] = useState<any[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const [showFeedback, setShowFeedback] = useState(false);
    const [lastSessionTaskId, setLastSessionTaskId] = useState("");
    const initialTimeRef = useRef(25 * 60);
    const { currentUser } = useAuth();

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

    const handleSessionComplete = async () => {
        setIsActive(false);
        const user = auth.currentUser;

        if (mode === "FOCUS") {
            if (user) {
                try {
                    const durationMinutes = Math.floor(initialTimeRef.current / 60);

                    let taskTitleForLog = topic;
                    let currentPomoForLog = null;
                    let totalPomosForLog = null;

                    if (selectedTaskId) {
                        const taskRef = doc(db, "tasks", selectedTaskId);
                        const taskDoc = await getDoc(taskRef);
                        const currentPomos = taskDoc.exists() ? (taskDoc.data().currentPomos || 0) : 0;
                        const totalPomos = taskDoc.exists() ? (taskDoc.data().totalPomos || 1) : 1;
                        
                        const newPomos = currentPomos + 1;
                        taskTitleForLog = taskDoc.exists() ? taskDoc.data().title : topic;
                        currentPomoForLog = newPomos;
                        totalPomosForLog = totalPomos;

                        await updateDoc(taskRef, { currentPomos: newPomos });
                        
                        setLastSessionTaskId(selectedTaskId);
                        
                        // ONLY show feedback pop-up if the goal is exhausted
                        if (newPomos >= totalPomos) {
                            setShowFeedback(true); 
                        } else {
                            toast.success(`Progress logged: ${newPomos}/${totalPomos} Pomos done!`);
                        }
                        
                        setSelectedTaskId(""); 
                    }

                    await addDoc(collection(db, "sessions"), {
                        userId: user.uid,
                        taskId: selectedTaskId || null,
                        taskTitle: taskTitleForLog,
                        duration: durationMinutes,
                        pomoCount: currentPomoForLog,
                        totalPomos: totalPomosForLog,
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

                    const currentStreak = userDoc.exists() && userDoc.data().currentStreak !== "0 Days" 
                        ? userDoc.data().currentStreak 
                        : "1 Day";

                    const updatedData = {
                        totalStudyTime: newTotal,
                        rank: newRank,
                        currentStreak: currentStreak,
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
            
            if (newCompletedCount % 4 === 0) {
                toast.success("Focus complete! Time for a LONG break.");
                setTimerMode("LONG_BREAK");
            } else {
                toast.success("Focus complete! Time for a short break.");
                setTimerMode("SHORT_BREAK");
            }

            if (Notification.permission === "granted") {
                new Notification("Study Pal Timer", { body: "Focus complete! Time for a break." });
            }

        } else {
            toast.success("Break complete! Back to focus.");
            if (Notification.permission === "granted") {
                new Notification("Study Pal Timer", { body: "Break complete! Time to focus." });
            }
            setTimerMode("FOCUS");
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
    }, [isActive, timeLeft, mode, topic]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(3);
    };

    const setTimerMode = (newMode: TimerMode) => {
        setMode(newMode);
        setIsActive(false);
        let time = 3;
        setTimeLeft(time);
        
        if (newMode === "FOCUS") initialTimeRef.current = 25 * 60;
        else if (newMode === "SHORT_BREAK") initialTimeRef.current = 5 * 60;
        else initialTimeRef.current = 15 * 60;
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
        topic,
        setTopic,
        toggleTimer,
        resetTimer,
        setTimerMode,
        formatTime,
        tasks,
        selectedTaskId,
        setSelectedTaskId,
        showFeedback,
        setShowFeedback,
        lastSessionTaskId,
    };

    return (
        <TimerContext.Provider value={value}>
            {children}
        </TimerContext.Provider>
    );
};
