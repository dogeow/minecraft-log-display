import "./bootstrap";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import useSWR, { SWRConfig } from "swr";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import Nav from "./components/Nav";
import ServerStatusPage from "./pages/ServerStatusPage";
import UsersPage from "./pages/UsersPage";
import DailyStatsPage from "./pages/DailyStatsPage";
import LoginsPage from "./pages/LoginsPage";
import ChatPage from "./pages/ChatPage";
import LoginLocationsPage from "./pages/LoginLocationsPage";
import LoginPage from "./pages/LoginPage";
import { Skeleton } from "./components/ui/skeleton";

const fetcher = (url) => fetch(url).then((r) => r.json());

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
  const { data, isLoading } = useSWR("/api/server-status", fetcher);

  if (isLoading || !data) return <LoadingSkeleton />;

  return <ServerStatusPage serverStatus={data.serverStatus} />;
}

function Users() {
  const location = useLocation();
  const { data, isLoading } = useSWR(`/api/users${location.search}`, fetcher);

  if (isLoading || !data) return <LoadingSkeleton />;

  return <UsersPage users={data.paginatedData} />;
}

function DailyStats() {
  const location = useLocation();
  const { data, isLoading } = useSWR(
    `/api/daily-stats${location.search}`,
    fetcher,
  );

  if (isLoading || !data) return <LoadingSkeleton />;

  return <DailyStatsPage dailyStats={data.paginatedData} />;
}

function Logins() {
  const location = useLocation();
  const { data, isLoading } = useSWR(`/api/logins${location.search}`, fetcher);

  if (isLoading || !data) return <LoadingSkeleton />;

  return <LoginsPage logins={data.paginatedData} />;
}

function Chat() {
  const location = useLocation();
  const { data: adminData } = useSWR("/api/is-admin", fetcher);
  const { data, isLoading } = useSWR(`/api/chat${location.search}`, fetcher);

  if (isLoading || !data) return <LoadingSkeleton />;

  return (
    <ChatPage
      chatMessages={data.paginatedData}
      isAdmin={adminData?.isAdmin ?? false}
    />
  );
}

function LoginLocations() {
  const location = useLocation();
  const { data: adminData } = useSWR("/api/is-admin", fetcher);
  const { data, isLoading } = useSWR(
    `/api/login-locations${location.search}`,
    fetcher,
  );

  if (isLoading || !data) return <LoadingSkeleton />;

  return (
    <LoginLocationsPage
      locations={data.paginatedData}
      isAdmin={adminData?.isAdmin ?? false}
    />
  );
}

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
        <Route path="/" element={<ServerStatus />} />
        <Route path="/users" element={<Users />} />
        <Route path="/daily-stats" element={<DailyStats />} />
        <Route path="/logins" element={<Logins />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/login-locations" element={<LoginLocations />} />
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
