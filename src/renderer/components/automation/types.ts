export interface AutomationLog {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export interface AutomationConfig {
  autoRaid: boolean;
  autoClip: boolean;
  autoMessage: boolean;
  autoMessageText: string;
  raidTarget: string | null;
  autoSlowMode: boolean;
  slowModeSpamThreshold: number;
  slowModeWaitTime: number;
  autoFollowerMode: boolean;
  followerModeDuration: number;
  autoBlockLinks: boolean;
  blockedTerms: string[];
  autoDeleteMessage: boolean;
  autoTimeoutUser: boolean;
  autoModerationEnabled: boolean;
}