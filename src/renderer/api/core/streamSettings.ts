import type { BaseResponse } from "./common";

export interface IngestServer {
  id: string;
  name: string;
  url_template: string;
  default: boolean;
  availability: number;
}

class StreamSettingsAPI {
  async getStreamKey(): Promise<BaseResponse<{ stream_key: string }>> {
    return window.backendAPI.streamSettings({ method: "getStreamKey" });
  }

  async getIngestServers(): Promise<BaseResponse<IngestServer[]>> {
    return window.backendAPI.streamSettings({ method: "getIngestServers" });
  }

  async regenerateStreamKey(): Promise<BaseResponse<{ stream_key: string }>> {
    return window.backendAPI.streamSettings({ method: "regenerateStreamKey" });
  }
  async getAutomationConfig(): Promise<
    BaseResponse<{ running: boolean; config: any }>
  > {
    return window.backendAPI["stream-manager"]({
      method: "getAutomationConfig",
    });
  }
  async updateAutomationConfig(config: any): Promise<BaseResponse<boolean>> {
    return window.backendAPI["stream-manager"]({
      method: "updateAutomationConfig",
      params: { config },
    });
  }
}

export const streamSettingsAPI = new StreamSettingsAPI();
