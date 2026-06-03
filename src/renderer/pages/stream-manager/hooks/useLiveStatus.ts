// src/renderer/pages/stream-manager/hooks/useLiveStatus.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { userAPI } from "../../../api/core/user";
import { streamsAPI } from "../../../api/core/streams";
import { eventsubAPI } from "../../../api/core/eventsub";

export const useLiveStatus = () => {
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [streamData, setStreamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const isLiveRef = useRef(false); // to avoid race conditions

  const checkLiveStatus = useCallback(async () => {
    try {
      const userRes = await userAPI.getCurrentUser();
      if (!userRes.status || !userRes.data) {
        setIsLive(false);
        setStreamData(null);
        return;
      }
      const streamRes = await streamsAPI.getStreamByUserLogin(userRes.data.login);
      const newIsLive = !!(streamRes.status && streamRes.data);
      setIsLive(newIsLive);
      setStreamData(streamRes.data || null);
      isLiveRef.current = newIsLive;

      // If live, stop polling (rely on EventSub for offline)
      if (newIsLive && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err) {
      console.error("Failed to check live status:", err);
      setIsLive(false);
      setStreamData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    checkLiveStatus();
  }, [checkLiveStatus]);

  // Start polling only when offline, and stop when live
  const startPollingIfOffline = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isLiveRef.current) {
      intervalRef.current = window.setInterval(() => {
        // Only poll if still offline (check current state)
        if (!isLiveRef.current) {
          checkLiveStatus();
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 30000);
    }
  }, [checkLiveStatus]);

  // Initial check
  useEffect(() => {
    checkLiveStatus();
  }, [checkLiveStatus]);

  // Start/stop polling based on isLive
  useEffect(() => {
    if (!isLiveRef.current) {
      startPollingIfOffline();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLiveRef.current, startPollingIfOffline]);

  // Listen for EventSub offline event to re‑enable polling
  useEffect(() => {
    const handleStreamOffline = () => {
      // Stream went offline, force refresh and restart polling
      setIsLive(false);
      setStreamData(null);
      isLiveRef.current = false;
      startPollingIfOffline();
    };
    window.backendAPI?.on?.("eventsub:stream-offline", handleStreamOffline);
    return () => {
      window.backendAPI?.off?.("eventsub:stream-offline", handleStreamOffline);
    };
  }, [startPollingIfOffline]);

  // Also listen for online event to stop polling immediately
  useEffect(() => {
    const handleStreamOnline = () => {
      // Stream came online – refresh data and stop polling
      checkLiveStatus();
    };
    window.backendAPI?.on?.("eventsub:stream-online", handleStreamOnline);
    return () => {
      window.backendAPI?.off?.("eventsub:stream-online", handleStreamOnline);
    };
  }, [checkLiveStatus]);

  // Also refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkLiveStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkLiveStatus]);

  return { isLive: isLive ?? false, streamData, loading, refresh };
};