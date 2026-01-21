import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Groups from './pages/Groups'
import Sessions from './pages/Sessions'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Settings from './pages/Settings'
import DashboardLayout from './layouts/DashboardLayout'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="groups" element={<Groups />} />
                <Route path="sessions" element={<Sessions />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="settings" element={<Settings />} />
            </Route>
        </Routes>
    )
}

export default App
