// src/main/services/shortcut-storage.service.js
const Store = require('electron-store');
const { globalShortcut } = require('electron');
const { shortcutService } = require('./shortcut.service');

class ShortcutStorageService {
  constructor() {
    this.store = new Store({ name: 'shortcuts' });
    this.defaults = {
      playpause: 'MediaPlayPause',
      play: 'Ctrl+Shift+P',
      pause: 'Ctrl+Shift+O',
      nextChannel: 'MediaNextTrack',
      previousChannel: 'MediaPreviousTrack',
      mute: 'Ctrl+Shift+M',
      volumeUp: 'Ctrl+Shift+Up',
      volumeDown: 'Ctrl+Shift+Down',
      fullscreen: 'F11',
      closePlayer: 'Ctrl+W',
    };
  }

  getShortcuts() {
    return this.store.get('shortcuts', this.defaults);
  }

  setShortcuts(shortcuts) {
    this.store.set('shortcuts', shortcuts);
    // Re-register
    shortcutService.unregisterAll();
    shortcutService.registerShortcuts(shortcuts);
  }

  resetToDefaults() {
    this.store.delete('shortcuts');
    shortcutService.unregisterAll();
    shortcutService.registerShortcuts(this.defaults);
  }
}

const shortcutStorage = new ShortcutStorageService();
module.exports = { shortcutStorage };