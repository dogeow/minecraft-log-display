import './bootstrap';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

    const bgGradient = theme === 'dark'
        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white'
        : 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white';

    return (
        <div className={`min-h-screen ${bgGradient} flex flex-col`}>
            <Nav isAdmin={window.isAdmin} />
            <div className="flex-1 flex flex-col justify-between">
                <Routes>
                    <Route path="/" element={<ServerStatusPage serverStatus={window.serverStatus} csrfToken={window.csrfToken} />} />
                    <Route path="/users" element={<UsersPage users={window.paginatedData} authUser={window.authUser} />} />
                    <Route path="/daily-stats" element={<DailyStatsPage dailyStats={window.paginatedData} />} />
                    <Route path="/logins" element={<LoginsPage logins={window.paginatedData} />} />
                    <Route path="/chat" element={<ChatPage chatMessages={window.paginatedData} isAdmin={window.isAdmin} />} />
                    <Route path="/login-locations" element={<LoginLocationsPage locations={window.paginatedData} isAdmin={window.isAdmin} />} />
                    <Route path="/login" element={window.isAdmin ? <Navigate to="/" /> : <LoginPage csrfToken={window.csrfToken} errors={window.errors} />} />
                </Routes>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(
    <BrowserRouter>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </BrowserRouter>
);
