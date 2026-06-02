import React, { useState, useEffect } from "react";
import { Users, UserPlus, LogOut, Upload, Download } from "lucide-react";
import { authAPI } from "../../../api/core/auth";
import { settingsAPI } from "../../../api/core/settings";
import { dialogs } from "../../../utils/dialogs";

interface Account {
  userId: string;
  login: string;
  displayName: string;
  profileImage: string;
  isActive: boolean;
}

export const AccountsTab: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const accs = await authAPI.getAccounts();
      setAccounts(accs);
    } catch (err) {
      console.error("Failed to load accounts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const addAccount = async () => {
    await authAPI.loginNewAccount();
    fetchAccounts();
  };

  const switchAccount = async (userId: string) => {
    await authAPI.switchAccount(userId);
    fetchAccounts();
  };

  const removeAccount = async (userId: string) => {
    if (await dialogs.confirm({title: "Remove this account?"})) {
      await authAPI.logoutAccount(userId);
      fetchAccounts();
    }
  };

  const exportSettings = async () => {
    const data = await settingsAPI.exportSettings();
    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "twitch-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      await settingsAPI.importSettings(data);
      dialogs.error("Settings imported. Please restart the app.");
    };
    input.click();
  };

  if (loading) return <div className="animate-pulse h-64 bg-[var(--card-bg)] rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Accounts</h2>
        <div className="flex gap-2">
          <button onClick={exportSettings} className="flex items-center gap-1 text-sm bg-[#2a2a2e] px-3 py-1 rounded-md">
            <Upload className="w-4 h-4" /> Export
          </button>
          <button onClick={importSettings} className="flex items-center gap-1 text-sm bg-[#2a2a2e] px-3 py-1 rounded-md">
            <Download className="w-4 h-4" /> Import
          </button>
        </div>
      </div>
      <div className="bg-[var(--card-bg)] rounded-xl p-6 space-y-4">
        {accounts.map((acc) => (
          <div key={acc.userId} className="flex items-center justify-between p-3 bg-[#2a2a2e]/30 rounded-lg">
            <div className="flex items-center gap-3">
              <img src={acc.profileImage} className="w-10 h-10 rounded-full" alt={acc.displayName} />
              <div>
                <div className="font-medium text-[var(--text-primary)]">{acc.displayName}</div>
                <div className="text-xs text-[var(--text-secondary)]">{acc.login}</div>
              </div>
              {acc.isActive && <span className="ml-2 text-xs bg-[#9147ff] px-2 py-0.5 rounded-full">Active</span>}
            </div>
            <div className="flex gap-2">
              {!acc.isActive && (
                <button onClick={() => switchAccount(acc.userId)} className="px-3 py-1 bg-[#9147ff] rounded-md text-sm">
                  Switch
                </button>
              )}
              <button onClick={() => removeAccount(acc.userId)} className="p-1 text-red-400 hover:text-red-300">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        <button onClick={addAccount} className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-[var(--card-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#9147ff] transition">
          <UserPlus className="w-4 h-4" /> Add Twitch Account
        </button>
      </div>
    </div>
  );
};