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
import AdminPage from "./pages/AdminPage";
import { appConfig as initialConfig } from "./lib/appConfig";
import { fetchJson } from "./lib/api";
import LoginPage from "./pages/LoginPage";

const fetcher = fetchJson;

function App() {
  return (
    <SWRConfig value={{ fetcher }}>
      <AppInner />
    </SWRConfig>
  );
}

function AppInner() {
  const {
    data: adminData,
    error: adminError,
    isLoading: adminLoading,
    mutate: checkAdmin,
  } = useSWR("/api/is-admin", fetcher, { shouldRetryOnError: false });
  const isAdmin = adminData?.isAdmin ?? false;

  return (
    <div className="min-h-screen">
      <Nav isAdmin={isAdmin} />
      <Routes>
        <Route
          path="/"
          element={
            <ApiPage key="status" endpoint="/api/server-status">
              {(data) => (
                <ServerStatusPage
                  serverStatus={data.serverStatus}
                  receivedAt={data.receivedAt}
                />
              )}
            </ApiPage>
          }
        />
        <Route
          path="/users"
          element={
            <ApiPage key="users" endpoint="/api/users" includeSearch>
              {(data) => <UsersPage users={data.paginatedData} />}
            </ApiPage>
          }
        />
        <Route
          path="/daily-stats"
          element={
            <ApiPage
              key="daily-stats"
              endpoint="/api/daily-stats"
              includeSearch
            >
              {(data) => <DailyStatsPage dailyStats={data.paginatedData} />}
            </ApiPage>
          }
        />
        <Route
          path="/logins"
          element={
            <ApiPage key="logins" endpoint="/api/logins" includeSearch>
              {(data) => <LoginsPage logins={data.paginatedData} />}
            </ApiPage>
          }
        />
        <Route
          path="/chat"
          element={
            <ApiPage key="chat" endpoint="/api/chat" includeSearch>
              {(data) => (
                <ChatPage chatMessages={data.paginatedData} isAdmin={isAdmin} />
              )}
            </ApiPage>
          }
        />
        <Route
          path="/login-locations"
          element={
            <ApiPage
              key="login-locations"
              endpoint="/api/login-locations"
              includeSearch
            >
              {(data) => (
                <LoginLocationsPage
                  locations={data.paginatedData}
                  isAdmin={isAdmin}
                />
              )}
            </ApiPage>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminPage
              isAdmin={isAdmin}
              loading={adminLoading}
              error={adminError}
              retry={() => checkAdmin()}
            />
          }
        />
        <Route
          path="/login"
          element={
            <LoginPage
              errors={initialConfig.errors}
              initialUsername={initialConfig.username}
            />
          }
        />
        <Route
          path="*"
          element={
            <main className="archive-shell">
              <section className="archive-empty">
                <h1>没有找到这个页面</h1>
                <a href="/">返回服务器首页</a>
              </section>
            </main>
          }
        />
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
