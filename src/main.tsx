import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Toaster } from "@/components/ui/sonner"

import { AuthProvider } from './contexts/AuthContext'
import { TimerProvider } from './contexts/TimerContext'

createRoot(document.getElementById('root')!).render(
    <AuthProvider>
        <TimerProvider>
            <BrowserRouter>
                <App />
                <Toaster />
            </BrowserRouter>
        </TimerProvider>
    </AuthProvider>
)
