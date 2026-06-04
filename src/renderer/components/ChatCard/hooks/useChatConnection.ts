// hooks/useChatConnection.ts
import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../../api/core/chat';

export const useChatConnection = (channelName?: string, isLive?: boolean) => {
  const [connected, setConnected] = useState(false);
  const channelNameRef = useRef(channelName);

  useEffect(() => {
    channelNameRef.current = channelName;
  }, [channelName]);

  useEffect(() => {
    if (!channelName || !isLive) {
      if (connected) {
        chatAPI.disconnect().catch(console.error);
        setConnected(false);
      }
      return;
    }
    const connect = async () => {
      try {
        await chatAPI.connect(channelName);
        setConnected(true);
      } catch (err) {
        console.error(err);
        setConnected(false);
      }
    };
    connect();
    return () => {
      chatAPI.disconnect().catch(console.error);
      setConnected(false);
    };
  }, [channelName, isLive]);

  // Listeners for connection status
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

  return { connected };
};