// src/routes/App.tsx
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../layouts/Layout";
import LoginPage from "../pages/auth/login";
import HelpPage from "../pages/help";
import StreamManagerPage from "../pages/stream-manager";
import AnalyticsPage from "../pages/analytics";
import ModerationPage from "../pages/moderation";
import CreatorDashboard from "../pages/creator-dashboard";
import SettingsPage from "../pages/settings";
import SchedulerPage from "../pages/scheduler";
import ChatCommandsPage from "../pages/chat-commands";
import PredictionsPage from "../pages/predictions";
import { streamManagerAPI } from "../api/core/streamManager";

// ─── Generic Placeholder (for pages not yet built) ─────────────
const PlaceholderPage = ({
  title,
  message,
}: {
  title: string;
  message?: string;
}) => {
  const location = window.location.pathname;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-[#9146ff]/10 flex items-center justify-center">
        <span className="text-4xl">🚧</span>
      </div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#a970ff] bg-clip-text text-transparent mb-3">
        {title}
      </h1>
      <p className="text-[var(--text-secondary)] max-w-md mb-6">
        {message ||
          "This page is under construction. It will be available soon."}
      </p>
      <div className="text-xs text-[#5e5e6b] bg-[var(--card-bg)] px-3 py-1 rounded-full">
        Route: {location}
      </div>
    </div>
  );
};

// ─── Auth Guard (redirect to login if not authenticated) ────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { authAPI } = await import("../api/core/auth");
        const result = await authAPI.isLoggedIn();
        setIsAuthenticated(result.data);
        if (!result.data) navigate("/login", { replace: true });
      } catch (err) {
        console.error("Auth check failed", err);
        navigate("/login", { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#9146ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

// ─── Main App ────────────────────────────────────────────────────
function App() {
  useEffect(() => {
    if (typeof window.backendAPI?.notifyAppReady === "function") {
      window.backendAPI.notifyAppReady();
      console.log("Notified main process: renderer is ready");
    }
  }, []);

  useEffect(() => {
    const handleRunCommercial = async () => {
      await streamManagerAPI.runCommercial(30);
    };
    window.backendAPI?.on?.("shortcut:runCommercial", handleRunCommercial);
    return () =>
      window.backendAPI?.off?.("shortcut:runCommercial", handleRunCommercial);
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/help" element={<HelpPage />} />

      {/* Protected routes (require login) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<StreamManagerPage />} />
        {/* <Route path="creator-dashboard" element={<DashboardPage />} /> */}

        {/* Following */}

        {/* Browse section */}

        {/* Library section */}
        {/* My Clips – not yet built */}

        {/* Community section */}
        {/* Community Notifications – not yet built */}
        <Route
          path="notifications"
          element={
            <PlaceholderPage
              title="Notifications"
              message="Alerts for follows, raids, and more."
            />
          }
        />

        {/* Settings section */}
        {/* <Route path="/settings" element={<SettingsPage />} /> */}

        {/* Channel page */}
        <Route path="/stream-manager" element={<StreamManagerPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/moderation" element={<ModerationPage />} />
        <Route path="/predictions" element={<PredictionsPage />} />
        <Route path="/chat-commands" element={<ChatCommandsPage />} />
        <Route path="/creator-dashboard" element={<CreatorDashboard />} />
        <Route path="/scheduler" element={<SchedulerPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* 404 – must be last */}
        <Route
          path="*"
          element={
            <PlaceholderPage
              title="404 - Not Found"
              message="The page you're looking for doesn't exist."
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
