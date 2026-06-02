import React from 'react';
import { Monitor, Wifi, WifiOff, RefreshCw, Key } from 'lucide-react';
import { useSceneManager } from '../hooks/useSceneManager';

const SceneManager: React.FC = () => {
  const {
    connected,
    scenes,
    currentScene,
    loading,
    showPasswordModal,
    obsPassword,
    setObsPassword,
    connectOBS,
    handlePasswordSubmit,
    refreshScenes,
    switchScene,
    setShowPasswordModal,
  } = useSceneManager();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-[#9147ff]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Scene Management</h3>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="text-green-400 text-xs flex items-center gap-1"><Wifi className="w-3 h-3" /> OBS Connected</span>
          ) : (
            <span className="text-red-400 text-xs flex items-center gap-1"><WifiOff className="w-3 h-3" /> OBS Not Connected</span>
          )}
          <button onClick={refreshScenes} className="p-1 rounded hover:bg-[var(--btn-secondary-bg)]" disabled={!connected}>
            <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {!connected ? (
        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-3">OBS WebSocket not connected.</p>
          <button onClick={() => connectOBS()} className="bg-[#9147ff] px-4 py-2 rounded-lg text-sm hover:bg-[#772ce8] text-white">
            Connect to OBS
          </button>
          <p className="text-xs text-[var(--text-secondary)] mt-3">
            Make sure OBS Studio is running and WebSocket server is enabled (Settings → WebSocket Server).
          </p>
        </div>
      ) : loading ? (
        <div className="text-center text-[var(--text-secondary)]">Loading scenes...</div>
      ) : scenes.length === 0 ? (
        <div className="text-center text-[var(--text-secondary)]">No scenes found</div>
      ) : (
        <div className="space-y-2">
          {scenes.map((scene) => (
            <button
              key={scene.sceneName}
              onClick={() => switchScene(scene.sceneName)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                currentScene === scene.sceneName
                  ? 'bg-[#9147ff] text-white'
                  : 'bg-[var(--btn-secondary-bg)] text-[var(--text-secondary)] hover:bg-[var(--btn-secondary-hover)]'
              }`}
            >
              {scene.sceneName}
            </button>
          ))}
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl p-6 w-96 border border-[var(--border-color)]">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-[#9147ff]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">OBS Authentication</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              OBS WebSocket server requires a password. Please enter it below.
            </p>
            <input
              type="password"
              value={obsPassword}
              onChange={(e) => setObsPassword(e.target.value)}
              placeholder="WebSocket password"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 py-2 bg-[#9147ff] rounded-lg hover:bg-[#772ce8] text-white"
              >
                Connect
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-2 bg-[var(--btn-secondary-bg)] rounded-lg hover:bg-[var(--btn-secondary-hover)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneManager;