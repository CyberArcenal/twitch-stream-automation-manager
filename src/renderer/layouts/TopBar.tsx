// src/layouts/TopBar.tsx
import React from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/Shared/SearchBar";
import { NotificationsDropdown } from "../components/Shared/NotificationsDropdown";
import { WhispersDropdown } from "../components/Shared/WhispersDropdown";
import { AccountSwitcher } from "../components/Shared/AccountSwitcher";

interface TopBarProps {
  toggleSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-[var(--sidebar-bg)] border-b border-[var(--sidebar-border)] flex items-center justify-between px-4 py-2 shadow-lg rounded-2xl mx-2 mt-2 backdrop-blur-sm bg-opacity-95">
      {/* Left – Menu + Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-[var(--card-hover-bg)] text-[var(--sidebar-text)] transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <span className="text-lg font-bold bg-gradient-to-r from-[#9146ff] to-[#772ce8] bg-clip-text text-transparent hidden sm:inline">
            Stream Manager
          </span>
        </div>
      </div>

      {/* Center – Search (optional, pwedeng tanggalin kung hindi kailangan) */}
      <div className="flex-1 max-w-xl mx-4">
        <SearchBar />
      </div>

      {/* Right – Actions & Account */}
      <div className="flex items-center gap-2">
        <NotificationsDropdown />
        <WhispersDropdown />
        <AccountSwitcher />
      </div>
    </header>
  );
};

export default TopBar;