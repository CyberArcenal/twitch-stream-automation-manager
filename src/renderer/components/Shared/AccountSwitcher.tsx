// src/layouts/TopBar/AccountSwitcher.tsx
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, UserPlus, Check, LogOut, Settings } from "lucide-react";
import { authAPI } from "../../api/core/auth";
import { userAPI, type TwitchUser } from "../../api/core/user";
import { dialogs } from "../../utils/dialogs";
import { useNavigate } from "react-router-dom";

interface StoredAccount {
  userId: string;
  login: string;
  displayName: string;
  profileImage: string;
  isActive: boolean;
}

export const AccountSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<TwitchUser | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [animMenu, setAnimMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadAccountsAndUser = async () => {
    try {
      // Assume authAPI.getAccounts() returns StoredAccount[]
      const accs = await authAPI.getAccounts();
      setAccounts(accs);
      const active = accs.find(a => a.isActive);
      if (active) {
        const userData = await userAPI.getUserById(active.userId);
        setCurrentUser(userData.data);
      }
    } catch (err) {
      console.error("Failed to load accounts", err);
    }
  };

  useEffect(() => {
    loadAccountsAndUser();
    const unsubscribe = window.backendAPI?.on?.("account:changed", loadAccountsAndUser);
    return () => unsubscribe?.();
  }, []);

  const toggleMenu = () => {
    if (!showMenu) {
      setShowMenu(true);
      setTimeout(() => setAnimMenu(true), 10);
    } else {
      setAnimMenu(false);
      setTimeout(() => setShowMenu(false), 150);
    }
  };

  const switchAccount = async (userId: string) => {
    await authAPI.switchAccount(userId);
    setShowMenu(false);
    // Reload entire app state (or trigger global refresh)
    window.location.reload();
  };

  const addAccount = async () => {
    await authAPI.loginNewAccount(); // opens OAuth popup
    await loadAccountsAndUser();
  };

  const logoutCurrent = async () => {
    if (!currentUser) return;
    const confirm = await dialogs.confirm({
      title: "Logout",
      message: `Logout from ${currentUser.display_name}?`
    });
    if (confirm) {
      await authAPI.logoutAccount(currentUser.id);
      const remaining = accounts.filter(a => a.userId !== currentUser.id);
      if (remaining.length === 0) {
        navigate("/login");
      } else {
        await loadAccountsAndUser();
      }
    }
  };

  const goToSettings = () => {
    navigate("/settings");
    setShowMenu(false);
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--card-hover-bg)] transition-colors"
      >
        <img
          src={currentUser.profile_image_url || "https://static-cdn.jtvnw.net/user-default-pictures-uv/75305d54-c7cc-40d1-bb9c-91fbe41b43f5-profile_image-70x70.png"}
          alt={currentUser.display_name}
          className="w-8 h-8 rounded-full border-2 border-[var(--primary-color)]"
        />
        <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] hidden sm:block" />
      </button>

      {showMenu && (
        <div
          className={`absolute right-0 mt-2 w-64 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-xl py-1 z-50 transition-all duration-150 origin-top-right
            ${animMenu ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          {accounts.map(acc => (
            <button
              key={acc.userId}
              onClick={() => switchAccount(acc.userId)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--card-hover-bg)] w-full text-left"
            >
              <img src={acc.profileImage} className="w-8 h-8 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--sidebar-text)] truncate">
                  {acc.displayName}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">@{acc.login}</p>
              </div>
              {acc.isActive && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
            </button>
          ))}
          <hr className="border-[var(--border-color)] my-1" />
          <button
            onClick={addAccount}
            className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--card-hover-bg)] w-full"
          >
            <UserPlus className="w-4 h-4" /> Add another account
          </button>
          <button
            onClick={goToSettings}
            className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--card-hover-bg)] w-full"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button
            onClick={logoutCurrent}
            className="flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-[var(--card-hover-bg)] w-full"
          >
            <LogOut className="w-4 h-4" /> Logout {currentUser.display_name}
          </button>
        </div>
      )}
    </div>
  );
};