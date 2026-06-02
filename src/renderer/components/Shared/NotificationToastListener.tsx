// src/components/Shared/NotificationToastListener.tsx
import { useEffect, useRef } from "react";
import { showToast } from "../../utils/notification";

type QueuedNotification = {
  title: string;
  message: string;
  type: string;
};

const mapType = (type: string): "success" | "error" | "warning" | "info" | "critical" => {
  switch (type) {
    case "success": return "success";
    case "warning": return "warning";
    case "error": return "error";
    case "critical": return "critical";
    default: return "info";
  }
};

export const NotificationToastListener = () => {
  const queueRef = useRef<QueuedNotification[]>([]);
  const isShowingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNext = () => {
    if (isShowingRef.current) return;
    if (queueRef.current.length === 0) return;

    const next = queueRef.current.shift();
    if (!next) return;

    isShowingRef.current = true;
    const { title, message, type } = next;

    showToast(`${title}: ${message}`, mapType(type), {
      duration: 5000,
      autoClose: true,
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isShowingRef.current = false;
      showNext();
    }, 5200);
  };

  const addToQueue = (notification: QueuedNotification) => {
    queueRef.current.push(notification);
    showNext();
  };

  useEffect(() => {
    const handleNotificationCreated = (data: any) => {
      addToQueue({
        title: data.title || 'Notification',
        message: data.message || '',
        type: data.type || 'info',
      });
    };

    if (window.backendAPI?.on) {
      window.backendAPI.on("notification:created", handleNotificationCreated);
    }

    return () => {
      if (window.backendAPI?.off) {
        window.backendAPI.off("notification:created", handleNotificationCreated);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
};