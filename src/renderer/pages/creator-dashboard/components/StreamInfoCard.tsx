import React, { useState, useEffect } from "react";
import { Edit3, Gamepad2, Hash, Globe } from "lucide-react";
import Select from "react-select";
import { streamManagerAPI } from "../../../api/core/streamManager";
import { gamesAPI, type Game } from "../../../api/core/games";
import { userAPI } from "../../../api/core/user";

interface StreamInfoCardProps {
  broadcasterId: string;
}

export const StreamInfoCard: React.FC<StreamInfoCardProps> = ({
  broadcasterId,
}) => {
  const [title, setTitle] = useState("");
  const [gameId, setGameId] = useState("");
  const [gameName, setGameName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [language, setLanguage] = useState("en");
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [availableLanguages] = useState([
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "ja", label: "Japanese" },
    { value: "ko", label: "Korean" },
    { value: "pt", label: "Portuguese" },
    { value: "ru", label: "Russian" },
    { value: "tr", label: "Turkish" },
    { value: "vi", label: "Vietnamese" },
  ]);
  const [gameSearch, setGameSearch] = useState("");
  const [gameOptions, setGameOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current stream info
  useEffect(() => {
    const loadStreamInfo = async () => {
      try {
        const status = await streamManagerAPI.getStreamStatus(); // actually get stream info from streamsAPI
        // We need a separate endpoint – use streamsAPI.getStreamByUserLogin
        const { streamsAPI } = await import("../../../api/core/streams");
        const user = await userAPI.getCurrentUser();
        const streamRes = await streamsAPI.getStreamByUserLogin(
          user?.data?.login || "",
        );
        if (streamRes.status && streamRes.data) {
          setTitle(streamRes.data.title);
          setGameId(streamRes.data.game_id);
          setGameName(streamRes.data.game_name);
        }
        // Load current tags
        const tagsRes = await streamManagerAPI.getStreamTags(broadcasterId);
        if (tagsRes.status) setTags(tagsRes.data.map((t: any) => t.tag_id));
        // Load available tags
        const allTagsRes = await streamManagerAPI.getAllStreamTags();
        if (allTagsRes.status)
          setAvailableTags(
            allTagsRes.data.map((t: any) => ({
              value: t.tag_id,
              label: t.localization_names.en,
            })),
          );
      } catch (err) {
        console.error("Failed to load stream info", err);
      } finally {
        setLoading(false);
      }
    };
    loadStreamInfo();
  }, [broadcasterId]);

  // Game search
  useEffect(() => {
    if (!gameSearch.trim()) {
      setGameOptions([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const res = await gamesAPI.searchCategories(gameSearch);
        if (res.status) {
          setGameOptions(
            res.data.map((g: Game) => ({ value: g.id, label: g.name })),
          );
        }
      } catch (err) {
        console.error("Game search failed", err);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [gameSearch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await streamManagerAPI.updateStreamInfo(broadcasterId, {
        title,
        game_id: gameId,
        tags,
        broadcaster_language: language,
      });
      // Show success feedback (optional)
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse h-80"></div>
    );

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Stream Information
        </h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1 bg-[var(--primary-color)]/90 rounded-md text-sm disabled:opacity-50 hover:bg-[var(--primary-color)]/100 transition"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
            <Edit3 className="w-3 h-3" /> Stream Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
            placeholder="Stream title"
          />
        </div>

        {/* Game / Category */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
            <Gamepad2 className="w-3 h-3" /> Game / Category
          </label>
          <Select
            options={gameOptions}
            onInputChange={(val) => setGameSearch(val)}
            onChange={(option: any) => {
              setGameId(option.value);
              setGameName(option.label);
            }}
            value={gameId ? { value: gameId, label: gameName } : null}
            placeholder="Search for a game..."
            className="react-select-container"
            classNamePrefix="react-select"
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                primary: "#9147ff",
                neutral0: "#0e0e10",
                neutral80: "#efeff1",
              },
            })}
          />
        </div>

        {/* Tags multi-select */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
            <Hash className="w-3 h-3" /> Tags
          </label>
          <Select
            isMulti
            options={availableTags}
            value={availableTags.filter((t) => tags.includes(t.value))}
            onChange={(selected: any) =>
              setTags(selected.map((opt: any) => opt.value))
            }
            placeholder="Select tags..."
            className="react-select-container"
            classNamePrefix="react-select"
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                primary: "#9147ff",
                neutral0: "#0e0e10",
                neutral80: "#efeff1",
              },
            })}
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
            <Globe className="w-3 h-3" /> Language
          </label>
          <Select
            options={availableLanguages}
            value={availableLanguages.find((l) => l.value === language)}
            onChange={(option: any) => setLanguage(option.value)}
            className="react-select-container"
            classNamePrefix="react-select"
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                primary: "#9147ff",
                neutral0: "#0e0e10",
                neutral80: "#efeff1",
              },
            })}
          />
        </div>
      </div>
    </div>
  );
};
