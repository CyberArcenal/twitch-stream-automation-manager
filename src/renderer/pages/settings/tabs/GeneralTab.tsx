import React, { useState, useEffect } from "react";
import { Moon, Sun, Globe, Play } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import { settingsAPI } from "../../../api/core/settings";

export const GeneralTab: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [language, setLanguage] = useState("en");
  const [autoPlay, setAutoPlay] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const langRes = await settingsAPI.getLanguage();
        if (langRes.status) setLanguage(langRes.data);
        const autoRes = await settingsAPI.get("autoPlay");
        if (autoRes.status) setAutoPlay(autoRes.data);
      } catch (err) {
        console.error("Failed to load general settings", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    await settingsAPI.setLanguage(lang);
  };

  const handleAutoPlayChange = async (value: boolean) => {
    setAutoPlay(value);
    await settingsAPI.set("autoPlay", value);
  };

  if (loading) return <div className="animate-pulse h-64 bg-[var(--card-bg)] rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">General</h2>
      <div className="bg-[var(--card-bg)] rounded-xl p-6 space-y-4 border border-[var(--border-color)]">
        {/* Theme */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="w-5 h-5 text-[#9147ff]" /> : <Sun className="w-5 h-5 text-[#9147ff]" />}
            <span className="text-[var(--text-primary)]">Theme</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("dark")}
              className={`px-3 py-1 rounded-md text-sm ${theme === "dark" ? "bg-[var(--primary-color)] text-[var(--text-primary)]" : "bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)]"}`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`px-3 py-1 rounded-md text-sm ${theme === "light" ? "bg-[var(--primary-color)] text-[var(--text-primary)]" : "bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)]"}`}
            >
              Light
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#9147ff]" />
            <span className="text-[var(--text-primary)]">Language</span>
          </div>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-3 py-1 text-[var(--text-primary)] text-sm"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="pt">Portuguese</option>
            <option value="ru">Russian</option>
            <option value="tr">Turkish</option>
            <option value="vi">Vietnamese</option>
          </select>
        </div>

        {/* Auto-play */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-[#9147ff]" />
            <span className="text-[var(--text-primary)]">Auto-play video when opening player</span>
          </div>
          <button
            onClick={() => handleAutoPlayChange(!autoPlay)}
            className={`relative w-10 h-5 rounded-full transition-colors ${autoPlay ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoPlay ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
};