import "./bootstrap";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import useSWR, { SWRConfig } from "swr";
import { ThemeProvider } from "./contexts/ThemeContext";
import Nav from "./components/Nav";
import ApiPage from "./components/ApiPage";
import ServerStatusPage from "./pages/ServerStatusPage";
import UsersPage from "./pages/UsersPage";
import DailyStatsPage from "./pages/DailyStatsPage";
import LoginsPage from "./pages/LoginsPage";
import ChatPage from "./pages/ChatPage";
import LoginLocationsPage from "./pages/LoginLocationsPage";
import LoginPage from "./pages/LoginPage";

const fetcher = (url) => fetch(url).then((r) => r.json());

function App() {
  return (
    <SWRConfig value={{ fetcher }}>
      <AppInner />
    </SWRConfig>
  );
}

function AppInner() {
  const { data: adminData } = useSWR("/api/is-admin", fetcher);
  const isAdmin = adminData?.isAdmin ?? false;

  return (
    <div className="min-h-screen">
      <Nav isAdmin={isAdmin} />
      <Routes>
        <Route
          path="/"
          element={
            <ApiPage endpoint="/api/server-status">
              {(data) => <ServerStatusPage serverStatus={data.serverStatus} />}
            </ApiPage>
          }
        />
        <Route
          path="/users"
          element={
            <ApiPage endpoint="/api/users" includeSearch>
              {(data) => <UsersPage users={data.paginatedData} />}
            </ApiPage>
          }
        />
        <Route
          path="/daily-stats"
          element={
            <ApiPage endpoint="/api/daily-stats" includeSearch>
              {(data) => <DailyStatsPage dailyStats={data.paginatedData} />}
            </ApiPage>
          }
        />
        <Route
          path="/logins"
          element={
            <ApiPage endpoint="/api/logins" includeSearch>
              {(data) => <LoginsPage logins={data.paginatedData} />}
            </ApiPage>
          }
        />
        <Route
          path="/chat"
          element={
            <ApiPage endpoint="/api/chat" includeSearch>
              {(data) => (
                <ChatPage
                  chatMessages={data.paginatedData}
                  isAdmin={isAdmin}
                />
              )}
            </ApiPage>
          }
        />
        <Route
          path="/login-locations"
          element={
            <ApiPage endpoint="/api/login-locations" includeSearch>
              {(data) => (
                <LoginLocationsPage
                  locations={data.paginatedData}
                  isAdmin={isAdmin}
                />
              )}
            </ApiPage>
          }
        />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(
  <BrowserRouter>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </BrowserRouter>,
);
