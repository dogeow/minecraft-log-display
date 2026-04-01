import './bootstrap';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Nav from './components/Nav';
import ServerStatusPage from './pages/ServerStatusPage';
import UsersPage from './pages/UsersPage';
import DailyStatsPage from './pages/DailyStatsPage';
import LoginsPage from './pages/LoginsPage';
import ChatPage from './pages/ChatPage';
import LoginLocationsPage from './pages/LoginLocationsPage';
import LoginPage from './pages/LoginPage';
import { Skeleton } from './components/ui/skeleton';

function App() {
    const { theme } = useTheme();
    const location = useLocation();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (window.isAdmin !== undefined) {
            setIsAdmin(window.isAdmin);
        }
    }, []);

    return (
        <div className="min-h-screen">
            <Nav isAdmin={isAdmin} />
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
    );
}

function LoadingSkeleton() {
    return (
        <div className="container mx-auto p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-10 w-full" />
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

    if (!data) return <LoadingSkeleton />;
    return <ServerStatusPage serverStatus={data} />;
}

function Users() {
    const [data, setData] = useState(null);
    const location = useLocation();
    const params = new URLSearchParams(window.location.search);

    useEffect(() => {
        const qs = params.toString();
        fetch(`/api/users${qs ? '?' + qs : ''}`)
            .then(r => r.json())
            .then(d => {
                setData(d.paginatedData);
                window.isAdmin = d.isAdmin;
            });
    }, [location.pathname, window.location.search]);

    if (!data) return <LoadingSkeleton />;
    return <UsersPage users={data} />;
}

function DailyStats() {
    const [data, setData] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const qs = params.toString();
        fetch(`/api/daily-stats${qs ? '?' + qs : ''}`)
            .then(r => r.json())
            .then(d => {
                setData(d.paginatedData);
                window.isAdmin = d.isAdmin;
            });
    }, [location.pathname, window.location.search]);

    if (!data) return <LoadingSkeleton />;
    return <DailyStatsPage dailyStats={data} />;
}

function Logins() {
    const [data, setData] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const qs = params.toString();
        fetch(`/api/logins${qs ? '?' + qs : ''}`)
            .then(r => r.json())
            .then(d => {
                setData(d.paginatedData);
                window.isAdmin = d.isAdmin;
            });
    }, [location.pathname, window.location.search]);

    if (!data) return <LoadingSkeleton />;
    return <LoginsPage logins={data} />;
}

function Chat() {
    const [data, setData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const qs = params.toString();
        fetch(`/api/chat${qs ? '?' + qs : ''}`)
            .then(r => r.json())
            .then(d => {
                setData(d.paginatedData);
                setIsAdmin(d.isAdmin);
                window.isAdmin = d.isAdmin;
            });
    }, [location.pathname, window.location.search]);

    if (!data) return <LoadingSkeleton />;
    return <ChatPage chatMessages={data} isAdmin={isAdmin} />;
}

function LoginLocations() {
    const [data, setData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const qs = params.toString();
        fetch(`/api/login-locations${qs ? '?' + qs : ''}`)
            .then(r => r.json())
            .then(d => {
                setData(d.paginatedData);
                setIsAdmin(d.isAdmin);
                window.isAdmin = d.isAdmin;
            });
    }, [location.pathname, window.location.search]);

    if (!data) return <LoadingSkeleton />;
    return <LoginLocationsPage locations={data} isAdmin={isAdmin} />;
}

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(
    <BrowserRouter>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </BrowserRouter>,
);
