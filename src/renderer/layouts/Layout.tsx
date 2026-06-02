// src/layouts/Layout.tsx
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./SideBar";
import TopBar from "./TopBar";
import { NotificationToastListener } from "../components/Shared/NotificationToastListener";
import { ShortcutsOverlay } from "../components/Shared/ShortcutsOverlay";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // default open
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (!mounted) return null;

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-base)]">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <NotificationToastListener />
      <ShortcutsOverlay />
    </div>
  );
};

export default Layout;