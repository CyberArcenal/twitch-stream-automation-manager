// src/renderer/api/core/shortcut.ts
import type { BaseResponse } from "./common";

type ShortcutAction =
  | "playpause"
  | "play"
  | "pause"
  | "nextChannel"
  | "previousChannel"
  | "mute"
  | "volumeUp"
  | "volumeDown"
  | "fullscreen"
  | "closePlayer";

class ShortcutAPI {
  async register(
    shortcuts: Record<string, ShortcutAction>,
  ): Promise<BaseResponse<void>> {
    return window.backendAPI.shortcut({
      method: "register",
      params: { shortcuts },
    });
  }

  async unregisterAll(): Promise<BaseResponse<void>> {
    return window.backendAPI.shortcut({ method: "unregisterAll" });
  }

  async unregister(
    accelerators: string | string[],
  ): Promise<BaseResponse<void>> {
    return window.backendAPI.shortcut({
      method: "unregister",
      params: { accelerators },
    });
  }

  async isRegistered(accelerator: string): Promise<BaseResponse<boolean>> {
    return window.backendAPI.shortcut({
      method: "isRegistered",
      params: { accelerator },
    });
  }

  async getShortcuts(): Promise<BaseResponse<Record<string, string>>> {
    return window.backendAPI.shortcut({ method: "getShortcuts" });
  }
  async setShortcuts(
    shortcuts: Record<string, string>,
  ): Promise<BaseResponse<boolean>> {
    return window.backendAPI.shortcut({
      method: "setShortcuts",
      params: { shortcuts },
    });
  }
  async resetShortcuts(): Promise<BaseResponse<boolean>> {
    return window.backendAPI.shortcut({ method: "resetShortcuts" });
  }
}

export const shortcutAPI = new ShortcutAPI();
