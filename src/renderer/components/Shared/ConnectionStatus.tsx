import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, MessageCircle, Monitor, Activity } from 'lucide-react';
import { useOBSConnection } from '../../pages/stream-manager/hooks/useOBSConnection';

// Custom hook to get chat connection status from the backend
const useChatConnection = () => {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);
    window.backendAPI?.on?.('chat:connected', handleConnected);
    window.backendAPI?.on?.('chat:disconnected', handleDisconnected);
    return () => {
      window.backendAPI?.off?.('chat:connected', handleConnected);
      window.backendAPI?.off?.('chat:disconnected', handleDisconnected);
    };
  }, []);
  return connected;
};

// Custom hook for EventSub connection
const useEventSubConnection = () => {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);
    window.backendAPI?.on?.('eventsub:connected', handleConnected);
    window.backendAPI?.on?.('eventsub:disconnected', handleDisconnected);
    return () => {
      window.backendAPI?.off?.('eventsub:connected', handleConnected);
      window.backendAPI?.off?.('eventsub:disconnected', handleDisconnected);
    };
  }, []);
  return connected;
};

export const ConnectionStatus: React.FC = () => {
  const { isConnected: obsConnected } = useOBSConnection();
  const chatConnected = useChatConnection();
  const eventSubConnected = useEventSubConnection();

  return (
    <div className="flex items-center gap-3 ml-auto mr-4">
      {/* Chat status */}
      <div className="flex items-center gap-1 text-xs">
        <MessageCircle className="w-3 h-3" />
        <span className={chatConnected ? 'text-green-400' : 'text-red-400'}>Chat</span>
      </div>
      {/* OBS status */}
      <div className="flex items-center gap-1 text-xs">
        <Monitor className="w-3 h-3" />
        <span className={obsConnected ? 'text-green-400' : 'text-red-400'}>OBS</span>
      </div>
      {/* EventSub status */}
      <div className="flex items-center gap-1 text-xs">
        <Activity className="w-3 h-3" />
        <span className={eventSubConnected ? 'text-green-400' : 'text-red-400'}>Events</span>
      </div>
    </div>
  );
};