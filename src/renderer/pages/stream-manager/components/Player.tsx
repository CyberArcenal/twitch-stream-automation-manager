import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

export interface PlayerRef {
  play: () => void;
  pause: () => void;
  setVolume: (level: number) => void;
  setMuted: (muted: boolean) => void;
  setQuality: (quality: string) => void;
  requestFullscreen: () => void;
  reload: () => void;
}

interface PlayerProps {
  channelName: string;
  autoplay?: boolean;
  onLoad?: () => void;
  onPlaying?: () => void;
  onPause?: () => void;
}

const Player = forwardRef<PlayerRef, PlayerProps>(
  ({ channelName, autoplay = true, onLoad }, ref) => {
    const webviewRef = useRef<HTMLWebViewElement>(null);
    const [reloadKey, setReloadKey] = React.useState(0);

    useEffect(() => {
      const webview = webviewRef.current;
      if (!webview) return;

      const handleLoad = () => {
        onLoad?.();
      };

      webview.addEventListener("did-finish-load", handleLoad);
      return () => {
        webview.removeEventListener("did-finish-load", handleLoad);
      };
    }, [onLoad]);

    const reload = () => {
      setReloadKey(prev => prev + 1);
    };

    const injectScript = (script: string) => {
      const webview = webviewRef.current;
      if (webview) {
        webview.executeJavaScript(script).catch(console.error);
      }
    };

    const setVolume = (level: number) => {
      injectScript(`const v = document.querySelector('video'); if(v) v.volume = ${Math.min(1, Math.max(0, level))};`);
    };

    const setMuted = (muted: boolean) => {
      injectScript(`const v = document.querySelector('video'); if(v) v.muted = ${muted};`);
    };

    const requestFullscreen = () => {
      webviewRef.current?.requestFullscreen();
    };

    useImperativeHandle(ref, () => ({
      play: () => console.log("[Player] play() not available"),
      pause: () => console.log("[Player] pause() not available"),
      setVolume,
      setMuted,
      setQuality: () => console.log("[Player] setQuality() not available"),
      requestFullscreen,
      reload,
    }));

    const parents = ["localhost", "127.0.0.1"];
    const parentParams = parents
      .map((p) => `parent=${encodeURIComponent(p)}`)
      .join("&");

    const src = `https://player.twitch.tv/?channel=${encodeURIComponent(
      channelName
    )}&${parentParams}&autoplay=${autoplay}&muted=false`;

    return (
      <webview
        key={reloadKey}
        ref={webviewRef}
        src={src}
        className="w-full h-full"
        style={{ border: "none", backgroundColor: "#000" }}
        allowFullScreen
        title={`${channelName} live stream`}
      />
    );
  }
);

export default Player;