import React from "react";
import { Upload, Trash2 } from "lucide-react";

interface CustomScript {
  name: string;
  enabled: boolean;
}

interface CustomScriptsProps {
  scripts: CustomScript[];
  onAddScript: (name: string) => void;
  onToggleScript: (index: number) => void;
  onRemoveScript: (index: number) => void;
}

export const CustomScripts: React.FC<CustomScriptsProps> = ({
  scripts,
  onAddScript,
  onToggleScript,
  onRemoveScript,
}) => {
  const [scriptName, setScriptName] = React.useState("");

  const handleAdd = () => {
    if (!scriptName.trim()) return;
    onAddScript(scriptName.trim());
    setScriptName("");
  };

  return (
    <div>
      <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">
        Custom Scripts
      </h4>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={scriptName}
          onChange={(e) => setScriptName(e.target.value)}
          placeholder="Script name"
          className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm"
        />
        <button onClick={handleAdd} className="p-1 bg-[var(--primary-color)] rounded hover:bg-[#772ce8]">
          <Upload className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {scripts.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] italic">No custom scripts loaded</p>
        ) : (
          scripts.map((script, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[var(--input-bg)] p-1 rounded">
              <span className="text-xs truncate">{script.name}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onToggleScript(idx)}
                  className="text-xs text-[var(--text-secondary)] hover:text-white"
                >
                  {script.enabled ? "Disable" : "Enable"}
                </button>
                <button onClick={() => onRemoveScript(idx)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};