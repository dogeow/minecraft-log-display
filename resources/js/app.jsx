import './bootstrap';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation, useSearchParams } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Nav from './components/Nav';
import ServerStatusPage from './pages/ServerStatusPage';
import UsersPage from './pages/UsersPage';
import DailyStatsPage from './pages/DailyStatsPage';
import LoginsPage from './pages/LoginsPage';
import ChatPage from './pages/ChatPage';
import LoginLocationsPage from './pages/LoginLocationsPage';
import LoginPage from './pages/LoginPage';

function App() {
    const { theme } = useTheme();
    const location = useLocation();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // 获取全局 isAdmin 状态
        if (window.isAdmin !== undefined) {
            setIsAdmin(window.isAdmin);
        }
    }, []);

    const bgGradient = theme === 'dark'
        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white'
        : 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white';

    return (
        <div className={`min-h-screen ${bgGradient} flex flex-col`}>
            <Nav isAdmin={isAdmin} />
            <div className="flex-1 flex flex-col justify-between">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<ServerStatus />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/daily-stats" element={<DailyStats />} />
                    <Route path="/logins" element={<Logins />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/login-locations" element={<LoginLocations />} />
                    <Route path="/login" element={isAdmin ? <ServerStatus /> : <LoginPage />} />
                </Routes>
            </div>
        </div>
    );
}

function ServerStatus() {
    const [data, setData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        fetch('/api/server-status')
            .then(r => r.json())
            .then(d => {
                setData(d.serverStatus);
                setIsAdmin(d.isAdmin);
                window.isAdmin = d.isAdmin;
            });
    }, []);

    if (!data) return <div className="flex-1" />;
    return <ServerStatusPage serverStatus={data} />;
}

function Users() {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);

    useEffect(() => {
        const qs = searchParams.toString();
        fetch(`/api/users${qs ? '?' + qs : ''}`)
            .then(r => r.json())
            .then(d => {
                setData(d.paginatedData);
                window.isAdmin = d.isAdmin;
            });
    }, [location.pathname, searchParams.toString()]);

    if (!data) return <div className="flex-1" />;
    return <UsersPage users={data} />;
}

function DailyStats() {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);

    useEffect(() => {
        const qs = searchParams.toString();
        fetch(`/api/daily-stats${qs ? '?' + qs : ''}`)
            .then(r => r.json())
            .then(d => {
                setData(d.paginatedData);
                window.isAdmin = d.isAdmin;
            });
    }, [location.pathname, searchParams.toString()]);

    if (!data) return <div className="flex-1" />;
    return <DailyStatsPage dailyStats={data} />;
}

function Logins() {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);

    useEffect(() => {
        const qs = searchParams.toString();
        fetch(`/api/logins${qs ? '?' + qs : ''}`)
            .then(r => r.json())
            .then(d => {
                setData(d.paginatedData);
                window.isAdmin = d.isAdmin;
            });
    }, [location.pathname, searchParams.toString()]);

    if (!data) return <div className="flex-1" />;
    return <LoginsPage logins={data} />;
}

function Chat() {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const qs = searchParams.toString();
        fetch(`/api/chat${qs ? '?' + qs : ''}`)
            .then(r => r.json())
            .then(d => {
                setData(d.paginatedData);
                setIsAdmin(d.isAdmin);
                window.isAdmin = d.isAdmin;
            });
    }, [location.pathname, searchParams.toString()]);

    if (!data) return <div className="flex-1" />;
    return <ChatPage chatMessages={data} isAdmin={isAdmin} />;
}

function LoginLocations() {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const qs = searchParams.toString();
        fetch(`/api/login-locations${qs ? '?' + qs : ''}`)
            .then(r => r.json())
            .then(d => {
                setData(d.paginatedData);
                setIsAdmin(d.isAdmin);
                window.isAdmin = d.isAdmin;
            });
    }, [location.pathname, searchParams.toString()]);

    if (!data) return <div className="flex-1" />;
    return <LoginLocationsPage locations={data} isAdmin={isAdmin} />;
}

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(
    <BrowserRouter>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </BrowserRouter>
);
