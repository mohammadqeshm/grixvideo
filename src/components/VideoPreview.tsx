/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Maximize2,
  Tv,
  Check,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { TimelineClip, MediaAsset } from "../types";

interface VideoPreviewProps {
  currentTime: number; // in seconds
  isPlaying: boolean;
  onSetTime: (time: number) => void;
  onSetPlaying: (playing: boolean) => void;
  totalDuration: number;
  clips: TimelineClip[];
  globalVolume: number;
  onSetVolume: (volume: number) => void;
  isMuted: boolean;
  onSetMuted: (muted: boolean) => void;
  assets?: MediaAsset[];
}

export default function VideoPreview({
  currentTime,
  isPlaying,
  onSetTime,
  onSetPlaying,
  totalDuration,
  clips,
  globalVolume,
  onSetVolume,
  isMuted,
  onSetMuted,
  assets = []
}: VideoPreviewProps) {
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [vuLevels, setVuLevels] = useState({ left: 30, right: 35 });

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 });
  
  // Track client audio players for real-time playhead sync of sound clips
  const audioPlayersRef = useRef<Record<string, HTMLAudioElement>>({});

  // Find active video content and text overlay clips at the exact current timeline position
  const activeVideoClip = clips.find(
    clip => clip.startTime <= currentTime && (clip.startTime + clip.duration) >= currentTime && (clip.type === "video" || clip.type === "image")
  );

  const lastActiveClipIdRef = useRef<string | null>(null);

  // Sync video element time and control states (play/pause) with timeline playhead
  useEffect(() => {
    const videos = [videoRef.current, fullscreenVideoRef.current].filter(Boolean) as HTMLVideoElement[];
    if (videos.length === 0 || !activeVideoClip) return;

    videos.forEach(video => {
      // Find physical duration from asset metadata
      const foundAsset = assets.find(a => a.id === activeVideoClip.assetId);
      const physicalDuration = foundAsset ? foundAsset.duration : (activeVideoClip.id === "clip-intro" ? 10.0 : 10.0);

      // Calculate elapsed offset time from the start of this clip on the timeline, capped at physical duration
      const clipOffsetTime = Math.min(physicalDuration, Math.max(0, currentTime - activeVideoClip.startTime));
      const isAtEnd = clipOffsetTime >= physicalDuration;
      
      // Play/Pause sync
      if (isPlaying && !isAtEnd) {
        if (video.paused) {
          // Sync time exactly when starting playback to ensure alignment
          video.currentTime = clipOffsetTime;
          video.play().catch(() => {});
        }
      } else {
        if (!video.paused) {
          video.pause();
        }
        // Sync time for precision scrub visual feedback when paused or at freeze frame
        if (Math.abs(video.currentTime - clipOffsetTime) > 0.05) {
          video.currentTime = clipOffsetTime;
        }
      }

      // Instantly sync time when transitioning or switching between active clips
      if (lastActiveClipIdRef.current !== activeVideoClip.id) {
        video.currentTime = clipOffsetTime;
      }

      // Safety sync fallback: only seek during active playback if there's a heavy drift of >0.8 seconds (e.g. manual ruler clicks)
      if (isPlaying && !isAtEnd && Math.abs(video.currentTime - clipOffsetTime) > 0.8) {
        video.currentTime = clipOffsetTime;
      }
    });

    if (activeVideoClip && lastActiveClipIdRef.current !== activeVideoClip.id) {
      lastActiveClipIdRef.current = activeVideoClip.id;
    }
  }, [currentTime, isPlaying, activeVideoClip, assets, fullscreenActive]);

  // Sync volume level and mute status to video
  useEffect(() => {
    const videos = [videoRef.current, fullscreenVideoRef.current].filter(Boolean) as HTMLVideoElement[];
    videos.forEach(video => {
      video.volume = isMuted ? 0 : globalVolume / 100;
      video.muted = isMuted;
    });
  }, [globalVolume, isMuted, activeVideoClip, fullscreenActive]);

  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      const targetRatio = 16 / 9;
      let boxWidth = width;
      let boxHeight = width / targetRatio;
      
      if (boxHeight > height) {
        boxHeight = height;
        boxWidth = height * targetRatio;
      }
      
      setBoxSize({
        width: Math.floor(boxWidth),
        height: Math.floor(boxHeight)
      });
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Simulate audio amplitude values when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isMuted && globalVolume > 0) {
      interval = setInterval(() => {
        const factor = globalVolume / 100;
        setVuLevels({
          left: Math.floor(Math.random() * 60 * factor + 20),
          right: Math.floor(Math.random() * 55 * factor + 25)
        });
      }, 120);
    } else {
      setVuLevels({ left: 5, right: 5 });
    }
    return () => clearInterval(interval);
  }, [isPlaying, isMuted, globalVolume]);

  // Synchronously play, volume-scale, speed-pitch and seek all active audio track clips relative to the active playhead
  useEffect(() => {
    const audioClips = clips.filter(clip => clip.type === "audio");
    
    // Purge cached elements of deleted clips
    const currentClipIds = new Set(audioClips.map(c => c.id));
    Object.keys(audioPlayersRef.current).forEach(id => {
      if (!currentClipIds.has(id)) {
        const p = audioPlayersRef.current[id];
        p.pause();
        p.remove();
        delete audioPlayersRef.current[id];
      }
    });

    audioClips.forEach(clip => {
      const asset = assets.find(a => a.id === clip.assetId);
      const rawUrl = asset?.localBlobUrl || asset?.thumbnailUrl || "";
      
      // If no valid audio tag is found but it is the default background_music clip, use the fallback song
      let src = rawUrl;
      if (clip.assetId === "asset-music" && (!rawUrl || rawUrl.includes("images.unsplash.com"))) {
        src = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
      }

      if (!src) return;

      let player = audioPlayersRef.current[clip.id];
      if (!player) {
        player = document.createElement("audio");
        player.crossOrigin = "anonymous";
        audioPlayersRef.current[clip.id] = player;
      }

      if (player.src !== src) {
        player.src = src;
        player.load();
      }

      const isActive = clip.startTime <= currentTime && currentTime <= (clip.startTime + clip.duration);

      if (isActive) {
        // compute targeted track duration offset
        const clipOffset = currentTime - clip.startTime;
        
        // sync volume and mute multipliers
        const volFraction = clip.volume / 100;
        const masterFraction = globalVolume / 100;
        player.volume = isMuted ? 0 : Math.min(1, Math.max(0, volFraction * masterFraction));

        // sync playback speed rate
        player.playbackRate = clip.speed || 1.0;

        // sync playhead drift checks
        if (Math.abs(player.currentTime - clipOffset) > 0.25) {
          player.currentTime = clipOffset;
        }

        if (isPlaying) {
          if (player.paused) {
            player.play().catch(err => {
              console.warn("Audio autoplay blocked or failed:", err);
            });
          }
        } else {
          if (!player.paused) {
            player.pause();
          }
        }
      } else {
        if (!player.paused) {
          player.pause();
        }
        // Scrubbing support: synchronize current time even if paused
        const clipOffset = Math.max(0, Math.min(clip.duration, currentTime - clip.startTime));
        if (Math.abs(player.currentTime - clipOffset) > 0.25) {
          player.currentTime = clipOffset;
        }
      }
    });
  }, [currentTime, isPlaying, clips, assets, globalVolume, isMuted]);

  // Clean play channels on component unmount
  useEffect(() => {
    return () => {
      Object.values(audioPlayersRef.current).forEach((p: any) => {
        if (p && typeof p.pause === "function") {
          p.pause();
          p.remove();
        }
      });
      audioPlayersRef.current = {};
    };
  }, []);

  // Frame by frame controls: Standard 24 frames-per-second conversion
  const stepFrame = (direction: "prev" | "next") => {
    const frameTime = 1 / 24; // 24 FPS
    let nextTime = direction === "prev" ? currentTime - frameTime : currentTime + frameTime;
    if (nextTime < 0) nextTime = 0;
    if (nextTime > totalDuration) nextTime = totalDuration;
    onSetTime(nextTime);
  };

  // Human descriptive time helper (hours:minutes:seconds:frames)
  const formatTimecode = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    const ms = Math.floor((seconds % 1) * 24).toString().padStart(2, "0"); // 24 frames
    return `${mins}:${secs}:${ms}`;
  };

  const activeTextClip = clips.find(
    clip => clip.startTime <= currentTime && (clip.startTime + clip.duration) >= currentTime && clip.type === "text"
  );

  // Determine which background imagery to show based on the active clip
  let previewUrl = "";
  let realLocalVideoUrl = "";
  let imageFilterStyle = {};

  if (activeVideoClip) {
    if (activeVideoClip.id === "clip-intro") {
      previewUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"; // gorge mountain scene
    } else if (activeVideoClip.id === "clip-sunset") {
      previewUrl = "https://images.unsplash.com/photo-1472214222541-d510753a4907?auto=format&fit=crop&w=800&q=80"; // golden sunset scene
    } else if (activeVideoClip.assetId) {
      // Dynamic newly created assets from drag-and-drop or modal creation
      const foundAsset = assets.find(a => a.id === activeVideoClip.assetId);
      if (foundAsset) {
        previewUrl = foundAsset.thumbnailUrl;
        if (foundAsset.type === "video" && foundAsset.localBlobUrl) {
          realLocalVideoUrl = foundAsset.localBlobUrl;
        }
      } else {
        previewUrl = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80";
      }
    }

    // Apply values modified by properties panel: scale, opacity, contrast, brightness, saturation, blur, hue
    imageFilterStyle = {
      transform: `scale(${activeVideoClip.scale / 100})`,
      opacity: activeVideoClip.opacity / 100,
      filter: `
        contrast(${activeVideoClip.contrast}%) 
        brightness(${activeVideoClip.brightness}%) 
        saturate(${activeVideoClip.saturate}%) 
        blur(${activeVideoClip.blur}px) 
        hue-rotate(${activeVideoClip.hueRotate}deg)
      `,
      transition: "transform 0.1s ease-out, filter 0.1s ease-out, opacity 0.1s ease-out"
    };
  }

  // Handle previewing newly added custom user elements if any
  const customBgStyle = !previewUrl ? {
    background: "#09090b" // neat charcoal backdrop for blank space/headers
  } : {};

  return (
    <div className="flex-1 bg-[#111113] border-r border-[#1d1d21] flex flex-col h-full select-none font-sans overflow-hidden">
      {/* Panel header name */}
      <div className="p-3.5 border-b border-[#1d1d21] shrink-0">
        <span className="text-[#ceced3] text-[13px] font-sans font-medium tracking-wide">Video Preview</span>
      </div>

      {/* Main viewport frame (16:9 box ratio) */}
      <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center p-4 min-w-0 bg-[#0c0c0d] relative min-h-0">
        <div 
          className="relative bg-black rounded-[4px] border border-[#1d1d21] overflow-hidden flex items-center justify-center"
          style={{
            width: boxSize.width ? `${boxSize.width}px` : "100%",
            height: boxSize.height ? `${boxSize.height}px` : "auto",
            aspectRatio: "16 / 9",
          }}
        >
          {realLocalVideoUrl ? (
            <video 
              ref={videoRef}
              src={realLocalVideoUrl}
              className="w-full h-full object-contain select-none"
              style={imageFilterStyle}
              muted={isMuted}
              playsInline
            />
          ) : previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Active monitor stream"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover select-none pointer-events-none"
              style={imageFilterStyle}
            />
          ) : (
            <div className="text-center p-4">
              <span className="text-[11px] text-zinc-600 font-mono">End of Sequence</span>
            </div>
          )}

          {/* Active Overlay Titles */}
          {activeTextClip && (
            <div 
              className="absolute pointer-events-none select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] text-center transition-all px-4 font-display font-medium uppercase tracking-widest leading-tight"
              style={{
                left: `${activeTextClip.textPositionX || 50}%`,
                top: `${activeTextClip.textPositionY || 50}%`,
                transform: "translate(-50%, -50%)",
                fontSize: `${(activeTextClip.textSize || 24) * 0.9}px`,
                color: activeTextClip.textColor || "#ffffff",
                opacity: (activeTextClip.opacity || 100) / 100
              }}
            >
              {activeTextClip.textOverlay || "PEAK VALLEYS"}
            </div>
          )}
        </div>
      </div>

      {/* Control Console */}
      <div className="bg-[#111113] border-t border-[#1d1d21] p-3.5 shrink-0 flex flex-col gap-2">
        
        {/* Scrubber indicator exactly at 3:15 */}
        <div className="relative w-full h-[6px] bg-[#1a1a1c] rounded-full overflow-visible group cursor-pointer mb-1">
          <input 
            type="range"
            min="0"
            max={totalDuration}
            step="0.01"
            value={currentTime}
            onChange={(e) => onSetTime(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          {/* Track slider design */}
          <div 
            className="absolute left-0 top-0 bottom-0 bg-[#428cdc] rounded-full"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          ></div>
          {/* Thumb marker exactly matching */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#bcbcbf] border border-[#111113] rounded-full shadow-md"
            style={{ left: `calc(${(currentTime / totalDuration) * 100}% - 5px)` }}
          ></div>
        </div>

        {/* Action controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-zinc-400">
            {/* Play/Pause Button */}
            <button 
              onClick={() => onSetPlaying(!isPlaying)}
              className="hover:text-white transition-colors cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-4 h-4 text-[#8a8a91] hover:text-white fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[#8a8a91] hover:text-white fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Step forward */}
            <button 
              onClick={() => stepFrame("next")}
              className="hover:text-white transition-colors cursor-pointer"
              title="Next frame"
            >
              <svg className="w-4 h-4 text-[#8a8a91] hover:text-white fill-current" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* Stop button */}
            <button 
              onClick={() => { onSetPlaying(false); onSetTime(0); }}
              className="hover:text-white transition-colors cursor-pointer"
              title="Stop"
            >
              <svg className="w-3.5 h-3.5 text-[#8a8a91] hover:text-white fill-current" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>

            {/* Step backward */}
            <button 
              onClick={() => stepFrame("prev")}
              className="hover:text-white transition-colors cursor-pointer"
              title="Previous Frame"
            >
              <svg className="w-4 h-4 text-[#8a8a91] hover:text-white fill-current rotate-180" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* Music speaker / Mute buttons */}
            <div className="flex items-center gap-2 border-l border-[#1d1d21] pl-3 ml-1.5 flex-row">
              <button 
                onClick={() => onSetMuted(!isMuted)}
                className="text-[#8a8a91] hover:text-white transition-colors cursor-pointer"
              >
                {isMuted || globalVolume === 0 ? (
                  <svg className="w-4 h-4 fill-none stroke-current stroke-[1.5]" viewBox="0 0 24 24">
                    <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 fill-none stroke-current stroke-[1.5]" viewBox="0 0 24 24">
                    <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </button>

              <input 
                type="range"
                min="0"
                max="100"
                value={globalVolume}
                onChange={(e) => onSetVolume(parseInt(e.target.value))}
                className="w-16 accent-[#428cdc] h-[3px] rounded bg-[#1a1a1c] cursor-pointer"
              />
            </div>
          </div>

          {/* Precision Running Time Display & Fullscreen button */}
          <div className="flex items-center gap-3">
            <div className="text-[12px] font-mono text-[#bcbcbf] tracking-wide font-medium bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800/40">
              {formatTimecode(currentTime)} / {formatTimecode(totalDuration)}
            </div>

            {/* Cinema Fullscreen launch button */}
            <button
              onClick={() => setFullscreenActive(true)}
              className="p-1.5 bg-[#19191c] hover:bg-[#25252a] text-[#8a8a91] hover:text-white rounded border border-zinc-800 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
              title="Enter Cinema Fullscreen Preview"
              id="fullscreen-preview-btn"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* IMMERSIVE CINEMA THEATER FULLSCREEN MODE OVERLAY */}
      {fullscreenActive && (
        <div className="fixed inset-0 bg-[#070709] z-[9999] flex flex-col justify-between p-6 select-none font-sans overflow-hidden">
          {/* Cinema Header */}
          <div className="flex items-center justify-between border-b border-[#1d1d21] pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#428cdc] animate-pulse"></span>
              <span className="text-zinc-200 text-[13px] font-sans font-medium tracking-wide">
                Cinema Theater Preview Mode {activeVideoClip ? `• Active Element: ${activeVideoClip.id}` : "• Sequence Idle"}
              </span>
            </div>
            
            <button
              onClick={() => setFullscreenActive(false)}
              className="px-3.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-md border border-red-500/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Exit Fullscreen</span>
            </button>
          </div>

          {/* Large Screen Viewport Area */}
          <div className="flex-1 flex items-center justify-center my-6 min-h-0 min-w-0">
            <div 
              className="relative bg-black rounded-lg border border-[#1d1d21] overflow-hidden flex items-center justify-center shadow-2xl transition-all"
              style={{
                width: "100%",
                maxHeight: "75vh",
                aspectRatio: "16 / 9",
              }}
            >
              {realLocalVideoUrl ? (
                <video 
                  ref={fullscreenVideoRef}
                  src={realLocalVideoUrl}
                  className="w-full h-full object-contain select-none"
                  style={imageFilterStyle}
                  muted={isMuted}
                  playsInline
                />
              ) : previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Active monitor stream"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  style={imageFilterStyle}
                />
              ) : (
                <div className="text-center p-4">
                  <span className="text-sm text-zinc-600 font-mono">End of Sequence</span>
                </div>
              )}

              {/* Active Overlay Titles */}
              {activeTextClip && (
                <div 
                  className="absolute pointer-events-none select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] text-center transition-all px-4 font-display font-medium uppercase tracking-widest leading-tight"
                  style={{
                    left: `${activeTextClip.textPositionX || 50}%`,
                    top: `${activeTextClip.textPositionY || 50}%`,
                    transform: "translate(-50%, -50%)",
                    fontSize: `${(activeTextClip.textSize || 24) * 1.5}px`, // Scaled up nicely
                    color: activeTextClip.textColor || "#ffffff",
                    opacity: (activeTextClip.opacity || 100) / 100
                  }}
                >
                  {activeTextClip.textOverlay || "PEAK VALLEYS"}
                </div>
              )}
            </div>
          </div>

          {/* Cinema Bottom controls console overlay */}
          <div className="bg-[#111113] border border-[#1d1d21] rounded-lg p-4 shrink-0 flex flex-col gap-3 shadow-xl max-w-4xl mx-auto w-full">
            {/* Scrubber slider */}
            <div className="relative w-full h-[6px] bg-[#1a1a1c] rounded-full overflow-visible group cursor-pointer">
              <input 
                type="range"
                min="0"
                max={totalDuration}
                step="0.01"
                value={currentTime}
                onChange={(e) => onSetTime(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div 
                className="absolute left-0 top-0 bottom-0 bg-[#428cdc] rounded-full"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              ></div>
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#ffffff] border border-[#111113] rounded-full shadow-md animate-pulse"
                style={{ left: `calc(${(currentTime / totalDuration) * 100}% - 6px)` }}
              ></div>
            </div>

            {/* controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-zinc-400">
                {/* Play/Pause icon */}
                <button 
                  onClick={() => onSetPlaying(!isPlaying)}
                  className="hover:text-white transition-colors cursor-pointer p-1"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5 text-[#8a8a91] hover:text-white fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[#8a8a91] hover:text-white fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Step next */}
                <button 
                  onClick={() => stepFrame("next")}
                  className="hover:text-white transition-colors cursor-pointer p-1"
                  title="Next Frame"
                >
                  <svg className="w-5 h-5 text-[#8a8a91] hover:text-white fill-current" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>

                {/* Stop */}
                <button 
                  onClick={() => { onSetPlaying(false); onSetTime(0); }}
                  className="hover:text-white transition-colors cursor-pointer p-1"
                  title="Stop Sequence"
                >
                  <svg className="w-4 h-4 text-[#8a8a91] hover:text-white fill-current" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                </button>

                {/* Step back */}
                <button 
                  onClick={() => stepFrame("prev")}
                  className="hover:text-white transition-colors cursor-pointer p-1 font-bold rounded"
                  title="Previous Frame"
                >
                  <svg className="w-5 h-5 text-[#8a8a91] hover:text-white fill-current rotate-180" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>

                {/* Mute and volume */}
                <div className="flex items-center gap-2 border-l border-[#1d1d21] pl-4 ml-1 flex-row">
                  <button 
                    onClick={() => onSetMuted(!isMuted)}
                    className="text-[#8a8a91] hover:text-white transition-colors cursor-pointer"
                  >
                    {isMuted || globalVolume === 0 ? (
                      <svg className="w-5 h-5 fill-none stroke-current stroke-[1.5]" viewBox="0 0 24 24">
                        <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 fill-none stroke-current stroke-[1.5]" viewBox="0 0 24 24">
                        <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    )}
                  </button>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={globalVolume}
                    onChange={(e) => onSetVolume(parseInt(e.target.value))}
                    className="w-24 accent-[#428cdc] h-[4px] rounded bg-[#1a1a1c] cursor-pointer"
                  />
                </div>
              </div>

              {/* Time display */}
              <div className="text-[13px] font-mono text-[#bcbcbf] tracking-wide font-semibold bg-zinc-900/80 px-3 py-1.5 rounded-md border border-zinc-850">
                {formatTimecode(currentTime)} / {formatTimecode(totalDuration)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
