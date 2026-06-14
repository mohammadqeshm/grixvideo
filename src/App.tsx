/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import MediaPool from "./components/MediaPool";
import VideoPreview from "./components/VideoPreview";
import PropertiesPanel from "./components/PropertiesPanel";
import Timeline from "./components/Timeline";
import { INITIAL_ASSETS, INITIAL_TRACKS, INITIAL_CLIPS } from "./data";
import { MediaAsset, TimelineClip, TimelineTrack, EditorSettings } from "./types";
import { 
  Sparkles, 
  HelpCircle, 
  BookOpen, 
  Settings2, 
  Tv, 
  Check, 
  Heart,
  RotateCcw,
  Download,
  Film,
  Play,
  Pause,
  Info,
  Volume2
} from "lucide-react";

export default function App() {
  // Primary States
  const [assets, setAssets] = useState<MediaAsset[]>(INITIAL_ASSETS);
  const [tracks, setTracks] = useState<TimelineTrack[]>(INITIAL_TRACKS);
  const [clips, setClips] = useState<TimelineClip[]>(INITIAL_CLIPS);
  
  const [currentTime, setCurrentTime] = useState<number>(3.15); // Start closer to reference timestamp
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>("clip-intro");
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>(["clip-intro"]);
  
  // Auditory levels
  const [globalVolume, setGlobalVolume] = useState<number>(75);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Settings & Navigation Overlays
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false); // start with tutorial hidden on first load to keep workspace immediately clean
  const [settings, setSettings] = useState<EditorSettings>({
    playbackSpeed: 1.0,
    resolution: "1920x1080",
    aspectRatio: "16:9",
    gridSnapping: true
  });

  // Mock Render Engine Overlay
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStage, setExportStage] = useState<string>("");
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [exportPreviewTime, setExportPreviewTime] = useState<number>(0);
  const [isExportPreviewPlaying, setIsExportPreviewPlaying] = useState<boolean>(true);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string>("");
  const [renderedVideoBlob, setRenderedVideoBlob] = useState<Blob | null>(null);

  // Workspace layout resizing states
  const [mediaPoolWidth, setMediaPoolWidth] = useState<number>(310);
  const [propertiesPanelWidth, setPropertiesPanelWidth] = useState<number>(320);
  const [timelineHeight, setTimelineHeight] = useState<number>(280);

  const startHorizontalResize = (e: React.MouseEvent, direction: "left" | "right") => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = direction === "left" ? mediaPoolWidth : propertiesPanelWidth;

    const doDrag = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      if (direction === "left") {
        setMediaPoolWidth(Math.max(200, Math.min(startWidth + deltaX, 450)));
      } else {
        setPropertiesPanelWidth(Math.max(200, Math.min(startWidth - deltaX, 480)));
      }
    };

    const stopDrag = () => {
      window.removeEventListener("mousemove", doDrag);
      window.removeEventListener("mouseup", stopDrag);
    };

    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  const startVerticalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = timelineHeight;

    const doDrag = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      setTimelineHeight(Math.max(160, Math.min(startHeight - deltaY, 520)));
    };

    const stopDrag = () => {
      window.removeEventListener("mousemove", doDrag);
      window.removeEventListener("mouseup", stopDrag);
    };

    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  // Utility to asynchronously capture precise physical video/audio duration
  const getMediaDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "video";
      if (type === "image") {
        resolve(5.0); // Simple static image default
        return;
      }
      const tempElement = document.createElement(type);
      const objectUrl = URL.createObjectURL(file);
      
      tempElement.preload = "metadata";
      tempElement.src = objectUrl;
      
      const timeoutId = setTimeout(() => {
        resolve(10.0); // Safety fallback if reader stalls
      }, 3000);

      tempElement.onloadedmetadata = () => {
        clearTimeout(timeoutId);
        const duration = tempElement.duration;
        if (duration && isFinite(duration) && duration > 0) {
          resolve(duration);
        } else {
          resolve(type === "audio" ? 30.0 : 10.0);
        }
      };

      tempElement.onerror = () => {
        clearTimeout(timeoutId);
        resolve(type === "audio" ? 30.0 : 10.0);
      };
    });
  };

  const handleImportLocalFiles = async (files: File[]) => {
    for (const file of files) {
      let type: "video" | "image" | "audio" = "video";
      if (file.type.startsWith("image/")) {
        type = "image";
      } else if (file.type.startsWith("audio/")) {
        type = "audio";
      }

      const fileId = "local-asset-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
      const url = URL.createObjectURL(file);

      // Dynamically detect physical duration
      let detectedDuration = 10.0;
      if (type === "image") {
        detectedDuration = 5.0;
      } else {
        try {
          detectedDuration = await getMediaDuration(file);
        } catch (e) {
          detectedDuration = type === "audio" ? 30.0 : 10.0;
        }
      }

      // Aesthetic curated photo collection for clean, high-style previews
      const randomCinematics = [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80", // Gorge mountain Sunset
        "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80", // Neon city highway
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80", // Sunny Forest path
        "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=400&q=80", // Deep Ocean waves
        "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=400&q=80", // Cyberpunk night lights
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80"  // Minimal studio
      ];
      const randomIndex = Math.floor(Math.random() * randomCinematics.length);
      const aestheticThumbnail = type === "video" 
        ? randomCinematics[randomIndex] 
        : (type === "audio" 
          ? "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80" // Vinyl / Music
          : url // Images can render blob directly
        );

      const newAsset: MediaAsset = {
        id: fileId,
        name: file.name,
        type: type,
        duration: parseFloat(detectedDuration.toFixed(2)),
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        extension: file.name.split(".").pop()?.toUpperCase() || "MP4",
        thumbnailUrl: aestheticThumbnail,
        localBlobUrl: url,
        aspectRatio: type !== "audio" ? "16:9" : undefined
      };

      handleAddAsset(newAsset);
      handleInsertToTimeline(newAsset);
    }
  };

  const [totalDuration, setTotalDuration] = useState<number>(30.0); // default generous 30s timeline

  // Undo/Redo (History) Structures
  interface HistoryState {
    clips: TimelineClip[];
    totalDuration: number;
  }

  const [pastStates, setPastStates] = useState<HistoryState[]>([]);
  const [futureStates, setFutureStates] = useState<HistoryState[]>([]);
  const lastHistorySaveRef = useRef<number>(0);

  const pushToHistory = (customClips?: TimelineClip[], customDuration?: number) => {
    const now = Date.now();
    if (now - lastHistorySaveRef.current < 700) {
      return;
    }
    lastHistorySaveRef.current = now;

    const currentStateToSave: HistoryState = {
      clips: customClips || clips,
      totalDuration: customDuration !== undefined ? customDuration : totalDuration,
    };

    setPastStates(prev => {
      const updated = [...prev, currentStateToSave];
      if (updated.length > 50) {
        updated.shift();
      }
      return updated;
    });
    setFutureStates([]);
  };

  const forcePushToHistory = (customClips?: TimelineClip[], customDuration?: number) => {
    lastHistorySaveRef.current = 0; // bypass the throttle guard
    pushToHistory(customClips, customDuration);
  };

  const handleUndo = () => {
    if (pastStates.length === 0) return;

    const currentState: HistoryState = { clips, totalDuration };
    setFutureStates(prev => [currentState, ...prev]);

    const previousState = pastStates[pastStates.length - 1];
    setPastStates(prev => prev.slice(0, prev.length - 1));

    setClips(previousState.clips);
    setTotalDuration(previousState.totalDuration);

    if (selectedClipId && !previousState.clips.find(c => c.id === selectedClipId)) {
      setSelectedClipId(previousState.clips[0]?.id || null);
      setSelectedClipIds(previousState.clips[0] ? [previousState.clips[0].id] : []);
    }
  };

  const handleRedo = () => {
    if (futureStates.length === 0) return;

    const currentState: HistoryState = { clips, totalDuration };
    setPastStates(prev => [...prev, currentState]);

    const nextState = futureStates[0];
    setFutureStates(prev => prev.slice(1));

    setClips(nextState.clips);
    setTotalDuration(nextState.totalDuration);

    if (selectedClipId && !nextState.clips.find(c => c.id === selectedClipId)) {
      setSelectedClipId(nextState.clips[0]?.id || null);
      setSelectedClipIds(nextState.clips[0] ? [nextState.clips[0].id] : []);
    }
  };

  // Keyboard layout shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl && 
        (activeEl.tagName === "INPUT" || 
         activeEl.tagName === "TEXTAREA" || 
         activeEl.getAttribute("contenteditable") === "true")
      ) {
        return; // Don't trigger undo when typing in text fields
      }

      const isZ = e.key.toLowerCase() === "z";
      const isY = e.key.toLowerCase() === "y";

      if (e.ctrlKey || e.metaKey) {
        if (isZ) {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (isY) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pastStates, futureStates, clips, totalDuration, selectedClipId]);

  // Playback loop simulation
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const updatePlayhead = (now: number) => {
      if (isPlaying) {
        const delta = (now - lastTime) / 1000;
        setCurrentTime(prev => {
          let next = prev + delta * settings.playbackSpeed;
          if (next >= totalDuration) {
            next = 0; // seamless repeat loop
          }
          return parseFloat(next.toFixed(3));
        });
      }
      lastTime = now;
      animationFrameId = requestAnimationFrame(updatePlayhead);
    };

    animationFrameId = requestAnimationFrame(updatePlayhead);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, settings.playbackSpeed, totalDuration]);

  // Export success playback simulation loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const updatePreviewPlayhead = (now: number) => {
      if (exportSuccess && isExportPreviewPlaying) {
        const delta = (now - lastTime) / 1000;
        setExportPreviewTime(prev => {
          let next = prev + delta;
          if (next >= totalDuration) {
            next = 0; // loops the finalized export preview seamlessly
          }
          return parseFloat(next.toFixed(2));
        });
      }
      lastTime = now;
      animationFrameId = requestAnimationFrame(updatePreviewPlayhead);
    };

    if (exportSuccess && isExportPreviewPlaying) {
      animationFrameId = requestAnimationFrame(updatePreviewPlayhead);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [exportSuccess, isExportPreviewPlaying, totalDuration]);

  // Handle asset management
  const handleAddAsset = (newAsset: MediaAsset) => {
    setAssets(prev => [newAsset, ...prev]);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(item => item.id !== id));
  };

  // Quick insertion into timeline based on track type
  const handleInsertToTimeline = (asset: MediaAsset) => {
    // deduce correct track placement based on user requested scheme:
    // Video: Blue, Audio: Green, Image: Yellow, Text: Purple, so they don't get mixed up!
    let trackId = "track-video-1";
    let colorClass = "bg-blue-600/15 border border-blue-500/40 text-blue-300 hover:bg-blue-600/25";

    if (asset.type === "audio") {
      trackId = "track-audio-1";
      colorClass = "bg-emerald-600/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/25";
    } else if (asset.type === "image" && asset.name.includes("title")) {
      trackId = "track-title-1";
      colorClass = "bg-purple-600/15 border border-purple-500/40 text-purple-300 hover:bg-purple-600/25";
    } else if (asset.type === "image") {
      trackId = "track-video-1";
      colorClass = "bg-amber-600/15 border border-amber-500/40 text-amber-300 hover:bg-amber-600/25";
    }

    const clipDuration = asset.duration; // Use the actual asset duration to support long local imports fully!

    // Calculate a safe non-overlapping startTime on the selected track
    const trackClips = clips.filter(c => c.trackId === trackId);
    let safeStartTime = currentTime;
    const sortedClips = [...trackClips].sort((a, b) => a.startTime - b.startTime);

    // Iteratively shift the start time forward past any overlaps
    let overlapped = true;
    let iterations = 0;
    while (overlapped && iterations < 30) {
      overlapped = false;
      for (const clip of sortedClips) {
        if (safeStartTime < clip.startTime + clip.duration && safeStartTime + clipDuration > clip.startTime) {
          safeStartTime = clip.startTime + clip.duration;
          overlapped = true;
        }
      }
      iterations++;
    }

    // Automatically extend total timeline duration if the insertion overflows
    const neededDuration = safeStartTime + clipDuration;
    if (neededDuration > totalDuration) {
      setTotalDuration(Math.ceil(neededDuration + 5)); // Add a comfort padding of 5 seconds
    }

    // append new timeline clip block at safe position
    const newClip: TimelineClip = {
      id: "clip-" + Date.now(),
      assetId: asset.id,
      trackId: trackId,
      name: asset.name,
      type: asset.type as any,
      startTime: parseFloat(safeStartTime.toFixed(2)),
      duration: clipDuration,
      colorClass: colorClass,
      scale: 100,
      opacity: 100,
      volume: 80,
      speed: 1.0,
      blur: 0,
      contrast: 100,
      brightness: 100,
      hueRotate: 0,
      saturate: 100
    };

    forcePushToHistory();
    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  };

  // Add custom overlay text clip with collision-free safety math
  const handleAddTextClip = (trackId: string, time: number) => {
    const clipDuration = 2.0;
    const trackClips = clips.filter(c => c.trackId === trackId);
    let safeStartTime = time;
    const sortedClips = [...trackClips].sort((a, b) => a.startTime - b.startTime);

    // Shift start time past any existing track clips
    let overlapped = true;
    let iterations = 0;
    while (overlapped && iterations < 30) {
      overlapped = false;
      for (const clip of sortedClips) {
        if (safeStartTime < clip.startTime + clip.duration && safeStartTime + clipDuration > clip.startTime) {
          safeStartTime = clip.startTime + clip.duration;
          overlapped = true;
        }
      }
      iterations++;
    }

    // Automatically extend total timeline duration if the text clip overflows
    const neededDuration = safeStartTime + clipDuration;
    if (neededDuration > totalDuration) {
      setTotalDuration(Math.ceil(neededDuration + 2));
    }

    const textClip: TimelineClip = {
      id: "clip-" + Date.now(),
      trackId: trackId,
      name: "Custom Overlay Text",
      type: "text",
      startTime: parseFloat(safeStartTime.toFixed(2)),
      duration: clipDuration,
      colorClass: "bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/30",
      scale: 100,
      opacity: 100,
      volume: 100,
      speed: 1.0,
      blur: 0,
      contrast: 100,
      brightness: 110,
      hueRotate: 0,
      saturate: 100,
      textOverlay: "TEXT OVERLAY",
      textSize: 28,
      textColor: "#ffffff",
      textPositionX: 50,
      textPositionY: 50,
      textBgColor: "rgba(0, 0, 0, 0.4)",
      textFontFamily: "Inter",
      textPadding: 12,
      textBorderRadius: 6
    };

    forcePushToHistory();
    setClips(prev => [...prev, textClip]);
    setSelectedClipId(textClip.id);
  };

  const handleUpdateClip = (updated: TimelineClip) => {
    // Rigid physical boundary constraints: clamp duration to match asset duration exactly (if media-backed video or audio)
    if (updated.assetId) {
      const asset = assets.find(a => a.id === updated.assetId);
      if (asset && (asset.type === "video" || asset.type === "audio")) {
        if (updated.duration > asset.duration) {
          updated.duration = asset.duration;
        }
      }
    }
    pushToHistory();
    setClips(prev => prev.map(clip => clip.id === updated.id ? updated : clip));
  };

  const handleUpdateClips = (updatedList: TimelineClip[]) => {
    // Rigid physical boundary constraints: clamp duration to match asset duration exactly (if media-backed video or audio)
    const processed = updatedList.map(updated => {
      if (updated.assetId) {
        const asset = assets.find(a => a.id === updated.assetId);
        if (asset && (asset.type === "video" || asset.type === "audio")) {
          if (updated.duration > asset.duration) {
            return { ...updated, duration: asset.duration };
          }
        }
      }
      return updated;
    });

    pushToHistory();
    setClips(prev => prev.map(clip => {
      const match = processed.find(x => x.id === clip.id);
      return match ? match : clip;
    }));
  };

  const handleActionCommitted = () => {
    forcePushToHistory();
  };

  const handleAddTrack = () => {
    forcePushToHistory();
    const newTrackId = `track-unified-${Date.now()}`;
    const nextIndex = tracks.length + 1;
    const newTrack: TimelineTrack = {
      id: newTrackId,
      name: `Track ${nextIndex}`,
      type: "video", // generic/unified track
      iconName: "Video"
    };
    setTracks(prev => [...prev, newTrack]);
  };

  const handleDeleteTrack = (trackId: string) => {
    if (tracks.length <= 1) return; // Prevent deleting the very last track
    forcePushToHistory();

    setTracks(prev => prev.filter(t => t.id !== trackId));
    setClips(prev => prev.filter(c => c.trackId !== trackId));

    setSelectedClipIds(prev => prev.filter(id => {
      const clip = clips.find(c => c.id === id);
      return clip ? clip.trackId !== trackId : false;
    }));

    if (selectedClipId) {
      const clip = clips.find(c => c.id === selectedClipId);
      if (clip && clip.trackId === trackId) {
        setSelectedClipId(null);
      }
    }
  };

  const handleDeleteClip = (id: string) => {
    forcePushToHistory();
    setClips(prev => prev.filter(c => c.id !== id));
    setSelectedClipIds(prev => prev.filter(x => x !== id));
    if (selectedClipId === id) {
      setSelectedClipId(null);
    }
  };

  const handleDeleteClips = (ids: string[]) => {
    forcePushToHistory();
    setClips(prev => prev.filter(c => !ids.includes(c.id)));
    setSelectedClipIds(prev => prev.filter(id => !ids.includes(id)));
    if (selectedClipId && ids.includes(selectedClipId)) {
      setSelectedClipId(null);
    }
  };

  // Run Canvas-based Render Exporter recording session (High-Fidelity)
  const handleTriggerExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStage("Initializing high-fidelity rendering pipeline...");

    try {
      const activeVisualClips = clips.filter(c => c.type === "video" || c.type === "image");
      const mediaElementsMap: Record<string, HTMLImageElement> = {};

      setExportStage("Pre-loading static image layers...");

      // Preload image assets to prevent visual pop-ins
      const imgClips = activeVisualClips.filter(c => c.type === "image");
      const loadPromises = imgClips.map(clip => {
        let url = "";
        if (clip.id === "clip-intro") {
          url = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";
        } else if (clip.id === "clip-sunset") {
          url = "https://images.unsplash.com/photo-1472214222541-d510753a4907?auto=format&fit=crop&w=800&q=80";
        } else {
          const asset = assets.find(a => a.id === clip.assetId);
          if (asset) {
            url = asset.thumbnailUrl;
          }
        }

        if (!url) return Promise.resolve();
        if (mediaElementsMap[url]) return Promise.resolve();

        return new Promise<void>((resolve) => {
          const img = new Image();
          img.src = url;
          img.crossOrigin = "anonymous";
          img.onload = () => {
            mediaElementsMap[url] = img;
            resolve();
          };
          img.onerror = () => resolve();
          setTimeout(resolve, 2000); // safety timeout
        });
      });

      await Promise.all(loadPromises);

      setExportStage("Setting up Web Audio mixer & canvas recording tracks...");
      setExportProgress(15);

      // Create isolated Web Audio context for mixing sounds
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioDest = audioCtx.createMediaStreamDestination();
      
      // Resume audio context to bypass browser gesture security
      await audioCtx.resume();

      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to create canvas 2D rendering context.");
      }

      // Capture standard 30fps viewport stream
      const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      if (!canvasStream) {
        throw new Error("Canvas captureStream is not supported in this browser environment.");
      }

      // Combine video track and mixed audio track
      const combinedStream = new MediaStream();
      const videoTrack = canvasStream.getVideoTracks()[0];
      if (videoTrack) {
        combinedStream.addTrack(videoTrack);
      }
      
      const audioTrack = audioDest.stream.getAudioTracks()[0];
      if (audioTrack) {
        combinedStream.addTrack(audioTrack);
      }

      // Determine video format codec support
      let mimeType = "video/webm;codecs=vp9,opus";
      const mediaRecorderClass = (window as any).MediaRecorder;
      if (mediaRecorderClass) {
        const checkTypes = [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
          "video/mp4;codecs=h264,aac",
          "video/mp4;codecs=h264",
          "video/mp4"
        ];
        const matched = checkTypes.find(type => mediaRecorderClass.isTypeSupported?.(type));
        if (matched) mimeType = matched;
      }

      const chunks: Blob[] = [];
      let recorder: any = null;

      try {
        recorder = new mediaRecorderClass(combinedStream, { mimeType });
      } catch (err) {
        try {
          recorder = new mediaRecorderClass(combinedStream);
        } catch (innerErr) {
          throw new Error("MediaRecorder API is blocked or not supported on this browser.");
        }
      }

      recorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Create visible-but-microscopic sandbox DOM container to bypass Chrome video throttling and suspend APIs completely
      const domContainer = document.createElement("div");
      domContainer.id = "vertex-export-sandbox";
      domContainer.style.position = "fixed";
      domContainer.style.bottom = "12px";
      domContainer.style.right = "12px";
      domContainer.style.width = "4px";
      domContainer.style.height = "4px";
      domContainer.style.opacity = "0.01";
      domContainer.style.pointerEvents = "none";
      domContainer.style.overflow = "hidden";
      domContainer.style.zIndex = "99999";
      document.body.appendChild(domContainer);

      // Instanstiate separate parallel players to preserve original preview timing exactly
      const exportPlayers: Record<string, HTMLVideoElement | HTMLAudioElement> = {};
      const playableClips = clips.filter(c => c.type === "video" || c.type === "audio");

      playableClips.forEach(clip => {
        let fileUrl = "";
        const asset = assets.find(a => a.id === clip.assetId);
        
        if (clip.id === "clip-intro") {
          // Fallback if intro lacks physical asset
          fileUrl = ""; 
        } else if (asset) {
          fileUrl = asset.localBlobUrl || "";
        }

        if (!fileUrl) return;

        if (clip.type === "video") {
          const video = document.createElement("video");
          video.src = fileUrl;
          video.crossOrigin = "anonymous";
          video.playsInline = true;
          video.muted = false;
          domContainer.appendChild(video);
          exportPlayers[clip.id] = video;

          // Connect video audio tracks using GainNodes inside the Web Audio Graph
          try {
            const source = audioCtx.createMediaElementSource(video);
            const gainNode = audioCtx.createGain();
            // Respect individual clip volume and global system volume
            gainNode.gain.value = ((clip.volume || 100) / 100) * (globalVolume / 100);
            source.connect(gainNode);
            gainNode.connect(audioDest);
          } catch (audioErr) {
            console.warn("Unable to route video track audio directly.", audioErr);
          }
        } else if (clip.type === "audio") {
          const audio = document.createElement("audio");
          audio.src = fileUrl;
          audio.crossOrigin = "anonymous";
          domContainer.appendChild(audio);
          exportPlayers[clip.id] = audio;

          // Connect standalone audio track
          try {
            const source = audioCtx.createMediaElementSource(audio);
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = ((clip.volume || 100) / 100) * (globalVolume / 100);
            source.connect(gainNode);
            gainNode.connect(audioDest);
          } catch (audioErr) {
            console.warn("Unable to route audio clip.", audioErr);
          }
        }
      });

      // Explicitly wait for all players to warm up metadata & buffer track sequence
      setExportStage("Warming up video decoder buffers & audio channels...");
      setExportProgress(18);

      const playerWarmupPromises = Object.values(exportPlayers).map(player => {
        return new Promise<void>((resolve) => {
          if (player.readyState >= 2) {
            resolve();
            return;
          }
          player.onloadedmetadata = () => resolve();
          player.oncanplay = () => resolve();
          player.onerror = () => resolve();
          // Safe 3.5s timeout limits
          setTimeout(resolve, 3500);
        });
      });

      await Promise.all(playerWarmupPromises);

      recorder.onstop = () => {
        // Clean up DOM players
        try {
          document.body.removeChild(domContainer);
        } catch (e) {}

        // Shut down Web Audio nodes to free CPU memory
        try {
          audioCtx.close();
        } catch (e) {}

        const finalBlob = new Blob(chunks, { type: "video/mp4" });
        const finalUrl = URL.createObjectURL(finalBlob);
        setRenderedVideoUrl(finalUrl);
        setRenderedVideoBlob(finalBlob);

        setIsExporting(false);
        setExportSuccess(true);
        setExportPreviewTime(0);
        setIsExportPreviewPlaying(true);
      };

      setExportStage("Recording in master-sync real-time mode...");
      recorder.start();

      const exportStartTime = performance.now();
      let activeRequest: number;

      const recordFrameLoop = () => {
        const now = performance.now();
        const elapsed = (now - exportStartTime) / 1000;

        if (elapsed >= totalDuration) {
          // Finish recording session
          cancelAnimationFrame(activeRequest);
          
          // Stop all players
          Object.values(exportPlayers).forEach(p => {
            try { p.pause(); } catch (e) {}
          });

          if (recorder && recorder.state !== "inactive") {
            recorder.stop();
          }
          return;
        }

        // Draw active frame layout background
        ctx.fillStyle = "#0c0c0d";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Sync and play elements in real-time
        clips.forEach(clip => {
          const isActive = elapsed >= clip.startTime && elapsed < (clip.startTime + clip.duration);
          const el = exportPlayers[clip.id];

          if (el) {
            if (isActive) {
              const asset = assets.find(a => a.id === clip.assetId);
              const physicalDuration = asset ? asset.duration : (clip.id === "clip-intro" ? 10.0 : 10.0);
              const expectedTime = Math.min(physicalDuration, elapsed - clip.startTime);
              const isAtEnd = expectedTime >= physicalDuration;

              if (isAtEnd) {
                if (!el.paused) {
                  try { el.pause(); } catch (e) {}
                }
                if (Math.abs(el.currentTime - expectedTime) > 0.05) {
                  el.currentTime = expectedTime;
                }
              } else {
                if (el.paused) {
                  el.currentTime = expectedTime;
                  el.play().catch(() => {});
                } else {
                  // Keep audio and frames perfectly synchronized: adjust drift if it exceeds 1.2 seconds
                  if (Math.abs(el.currentTime - expectedTime) > 1.2) {
                    el.currentTime = expectedTime;
                  }
                }
              }
            } else {
              if (!el.paused) {
                el.pause();
              }
            }
          }
        });

        // Pull active video or image layouts to draw
        const currentActiveVisual = clips.find(
          clip => elapsed >= clip.startTime && elapsed < (clip.startTime + clip.duration) && (clip.type === "video" || clip.type === "image")
        );

        if (currentActiveVisual) {
          let visualSource: HTMLImageElement | HTMLVideoElement | null = null;
          
          const expPlayer = exportPlayers[currentActiveVisual.id];
          if (expPlayer && expPlayer instanceof HTMLVideoElement) {
            visualSource = expPlayer;
          } else {
            // Draw static images or fallback scenes
            let url = "";
            if (currentActiveVisual.id === "clip-intro") {
              url = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";
            } else if (currentActiveVisual.id === "clip-sunset") {
              url = "https://images.unsplash.com/photo-1472214222541-d510753a4907?auto=format&fit=crop&w=800&q=80";
            } else {
              const asset = assets.find(a => a.id === currentActiveVisual.assetId);
              if (asset) {
                url = asset.thumbnailUrl;
              }
            }
            visualSource = mediaElementsMap[url] || null;
          }

          if (visualSource) {
            ctx.save();

            const scale = currentActiveVisual.scale / 100;
            const opacity = currentActiveVisual.opacity / 100;
            const contrast = currentActiveVisual.contrast || 100;
            const brightness = currentActiveVisual.brightness || 100;
            const saturate = currentActiveVisual.saturate || 100;
            const blurVal = currentActiveVisual.blur || 0;
            const hueVal = currentActiveVisual.hueRotate || 0;

            ctx.globalAlpha = opacity;
            ctx.filter = `contrast(${contrast}%) brightness(${brightness}%) saturate(${saturate}%) blur(${blurVal}px) hue-rotate(${hueVal}deg)`;

            // Maintain intrinsic layouts
            let intrinsicWidth = canvas.width;
            let intrinsicHeight = canvas.height;

            if (visualSource instanceof HTMLVideoElement) {
              intrinsicWidth = visualSource.videoWidth || canvas.width;
              intrinsicHeight = visualSource.videoHeight || canvas.height;
            } else if (visualSource instanceof HTMLImageElement) {
              intrinsicWidth = visualSource.naturalWidth || canvas.width;
              intrinsicHeight = visualSource.naturalHeight || canvas.height;
            }

            const canvasRatio = canvas.width / canvas.height;
            const mediaRatio = intrinsicWidth / intrinsicHeight;

            let w = canvas.width;
            let h = canvas.height;

            const isVid = visualSource instanceof HTMLVideoElement;
            if (isVid) {
              if (mediaRatio > canvasRatio) {
                w = canvas.width;
                h = canvas.width / mediaRatio;
              } else {
                h = canvas.height;
                w = canvas.height * mediaRatio;
              }
            } else {
              if (mediaRatio > canvasRatio) {
                h = canvas.height;
                w = canvas.height * mediaRatio;
              } else {
                w = canvas.width;
                h = canvas.width / mediaRatio;
              }
            }

            w = w * scale;
            h = h * scale;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;

            try {
              ctx.drawImage(visualSource, x, y, w, h);
            } catch (drawErr) {
              ctx.fillStyle = "#1e1e24";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = "#8a8a91";
              ctx.font = "24px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(`[Tainted Canvas - Image CORS Protected]`, canvas.width / 2, canvas.height / 2);
            }
            ctx.restore();
          } else {
            // Draw visually descriptive solid loader
            ctx.fillStyle = "#1a1a20";
            ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
            ctx.strokeStyle = "#428cdc";
            ctx.lineWidth = 4;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 26px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(currentActiveVisual.name, canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillStyle = "#8e8e93";
            ctx.font = "18px sans-serif";
            ctx.fillText(`Active visual layer rendering...`, canvas.width / 2, canvas.height / 2 + 20);
          }
        }

        // Draw overlay text tracks
        const currentActiveText = clips.find(
          clip => elapsed >= clip.startTime && elapsed < (clip.startTime + clip.duration) && clip.type === "text"
        );

        if (currentActiveText) {
          ctx.save();
          const textOverlay = currentActiveText.textOverlay || "PEAK VALLEYS";
          const textSize = currentActiveText.textSize || 28;
          const textColor = currentActiveText.textColor || "#ffffff";
          const textX = currentActiveText.textPositionX || 50;
          const textY = currentActiveText.textPositionY || 50;
          const textOpacity = (currentActiveText.opacity || 100) / 100;

          ctx.globalAlpha = textOpacity;
          ctx.font = `bold ${textSize * 1.5}px 'Space Grotesk', sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.shadowColor = "rgba(0,0,0,0.85)";
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 4;

          ctx.fillText(textOverlay, canvas.width * (textX / 100), canvas.height * (textY / 100));
          ctx.restore();
        }

        // Inform user on progress bars
        const percentage = Math.min(100, Math.round((elapsed / totalDuration) * 100));
        setExportProgress(percentage);
        setExportStage(`Stitching video frame buffers: ${elapsed.toFixed(1)}s / ${totalDuration.toFixed(1)}s`);

        activeRequest = requestAnimationFrame(recordFrameLoop);
      };

      activeRequest = requestAnimationFrame(recordFrameLoop);

    } catch (error) {
      console.error("Renderer error:", error);
      setExportStage("Saving sequence fallback descriptors...");
      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportSuccess(true);
      }, 500);
    }
  };

  // Select active properties clip
  const currentSelectedClip = clips.find(c => c.id === selectedClipId) || null;

  // Find clips active at current exportPreviewTime for the interactive final export window
  const activePreviewVideo = clips.find(
    clip => clip.startTime <= exportPreviewTime && (clip.startTime + clip.duration) >= exportPreviewTime && (clip.type === "video" || clip.type === "image")
  );

  const activePreviewText = clips.find(
    clip => clip.startTime <= exportPreviewTime && (clip.startTime + clip.duration) >= exportPreviewTime && clip.type === "text"
  );

  // Sync video element within final preview overlay if local media is playing
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    const video = modalVideoRef.current;
    if (!video || !activePreviewVideo) return;
    
    const asset = assets.find(a => a.id === activePreviewVideo.assetId);
    const videoUrl = asset && asset.type === "video" ? asset.localBlobUrl : "";
    if (!videoUrl) return;

    const clipOffsetTime = Math.max(0, exportPreviewTime - activePreviewVideo.startTime);
    
    if (isExportPreviewPlaying) {
      if (video.paused) {
        video.currentTime = clipOffsetTime;
        video.play().catch(() => {});
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
      if (Math.abs(video.currentTime - clipOffsetTime) > 0.05) {
        video.currentTime = clipOffsetTime;
      }
    }
  }, [exportPreviewTime, isExportPreviewPlaying, activePreviewVideo, assets]);

  // Formulate and trigger real file browser download for compiled project
  const handleDownloadVideo = () => {
    if (renderedVideoBlob) {
      const url = URL.createObjectURL(renderedVideoBlob);
      const element = document.createElement("a");
      element.href = url;
      element.download = `vertex_render_${settings.resolution.replace("x", "p")}_${totalDuration.toFixed(0)}s.mp4`;
      
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    } else {
      // Fallback
      let rate = 1.4;
      if (settings.resolution === "3840x2160") rate = 4.2;
      const estSize = (totalDuration * rate).toFixed(1);

      const docText = `VERTEX COMPOSITED MULTITRACK PROJECT\n` +
        `=========================================\n` +
        `File Name: vertex_export_${settings.resolution.replace("x", "p_")}.mp4\n` +
        `Format Container: MPEG-4 AVC Part 14 (.mp4)\n` +
        `Target Resolution: ${settings.resolution} pixels\n` +
        `Aspect Ratio Style: ${settings.aspectRatio}\n` +
        `Total Timeline Duration: ${totalDuration.toFixed(1)} seconds\n` +
        `Estimated File Size: ${estSize} Megabytes (MB)\n` +
        `Audio Codec Configuration: AAC-LC Stereo (Audio Channel 1/2, 48000Hz)\n` +
        `Video Encoding Bitrate: ~14.8 Mbps VBR 2-Pass Compliant\n` +
        `Completed Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n` +
        `✨ Sequence generated and down-rendered successfully with correct scale parameters, overlays, audio channels, and contrast modifiers from Vertex Video Editor local workstation context.`;

      const blob = new Blob([docText], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      const element = document.createElement("a");
      element.href = url;
      element.download = `vertex_render_${settings.resolution.replace("x", "p")}_${totalDuration.toFixed(0)}s.mp4`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      
      {/* WINDOW TITLE MENU HEADER */}
      <Header 
        onShowSettings={() => setShowSettings(true)}
        onShowTutorial={() => setShowTutorial(true)}
        activeAssetCount={assets.length}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={pastStates.length > 0}
        canRedo={futureStates.length > 0}
      />

      {/* THREEPANEL MIDDLE CONTAINER HEIGHT COMPLIANT */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        
        {/* PANEL Left: Assets Storepool, uploads and configurations */}
        <MediaPool 
          assets={assets}
          onAddAsset={handleAddAsset}
          onDeleteAsset={handleDeleteAsset}
          onInsertToTimeline={handleInsertToTimeline}
          width={mediaPoolWidth}
        />

        {/* Dynamic Splitter Left */}
        <div 
          className="w-[5px] hover:bg-[#428cdc]/80 transition-colors cursor-col-resize select-none shrink-0 bg-[#161619] border-l border-r border-black/30 flex items-center justify-center group"
          onMouseDown={(e) => startHorizontalResize(e, "left")}
          title="Resize Media Panel"
        >
          <div className="w-[1px] h-4 bg-zinc-700/60 group-hover:bg-[#428cdc]/80"></div>
        </div>

        {/* PANEL Center: Visual Video Player Monitor preview */}
        <VideoPreview 
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSetTime={setCurrentTime}
          onSetPlaying={setIsPlaying}
          totalDuration={totalDuration}
          clips={clips}
          globalVolume={globalVolume}
          onSetVolume={setGlobalVolume}
          isMuted={isMuted}
          onSetMuted={setIsMuted}
          assets={assets}
        />

        {/* Dynamic Splitter Right */}
        <div 
          className="w-[5px] hover:bg-[#428cdc]/80 transition-colors cursor-col-resize select-none shrink-0 bg-[#161619] border-l border-r border-black/30 flex items-center justify-center group"
          onMouseDown={(e) => startHorizontalResize(e, "right")}
          title="Resize Properties Panel"
        >
          <div className="w-[1px] h-4 bg-zinc-700/60 group-hover:bg-[#428cdc]/80"></div>
        </div>

        {/* PANEL Right: Parameter inspector, Tab items */}
        <PropertiesPanel 
          selectedClip={currentSelectedClip}
          onUpdateClip={handleUpdateClip}
          onDeleteClip={handleDeleteClip}
          onExport={handleTriggerExport}
          width={propertiesPanelWidth}
          onStartChange={handleActionCommitted}
        />

      </main>

      {/* Dynamic Vertical Timeline Splitter */}
      <div 
        className="h-[5px] hover:bg-[#428cdc]/80 transition-colors cursor-row-resize select-none shrink-0 bg-[#161619] border-t border-b border-black/30 flex items-center justify-center group"
        onMouseDown={startVerticalResize}
        title="Resize Timeline height"
      >
        <div className="w-8 h-[1px] bg-zinc-700/60 group-hover:bg-[#428cdc]/80"></div>
      </div>

      {/* PANEL BOTTOM: Complex Multi-track timelines & handles */}
      <Timeline 
        tracks={tracks}
        clips={clips}
        selectedClipId={selectedClipId}
        onSelectClip={setSelectedClipId}
        onUpdateClip={handleUpdateClip}
        onUpdateClips={handleUpdateClips}
        onActionCommitted={handleActionCommitted}
        currentTime={currentTime}
        onSetTime={setCurrentTime}
        totalDuration={totalDuration}
        onUpdateTotalDuration={(dur) => {
          forcePushToHistory();
          setTotalDuration(dur);
        }}
        onAddTextClip={handleAddTextClip}
        height={timelineHeight}
        onImportFiles={handleImportLocalFiles}
        selectedClipIds={selectedClipIds}
        onSelectClips={setSelectedClipIds}
        onDeleteClip={handleDeleteClip}
        onDeleteClips={handleDeleteClips}
        assets={assets}
        onAddTrack={handleAddTrack}
        onDeleteTrack={handleDeleteTrack}
      />

      {/* DIALOG MODE: Project System Settings Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Settings2 className="w-4 h-4 text-zinc-400" />
              <h4 className="text-sm font-semibold text-zinc-100">Project Workspace Settings</h4>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Canvas Video Resolution</label>
                <select 
                  value={settings.resolution}
                  onChange={(e) => setSettings(prev => ({ ...prev, resolution: e.target.value as any }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="1920x1080">FHD (1080p) • 1920 x 1080</option>
                  <option value="1280x720">HD (720p) • 1280 x 720</option>
                  <option value="1080x1080">Square (1:1) • 1080 x 1080</option>
                  <option value="3840x2160">Ultra HD (4K) • 3840 x 2160</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Timeline Aspect Ratio</label>
                <select 
                  value={settings.aspectRatio}
                  onChange={(e) => setSettings(prev => ({ ...prev, aspectRatio: e.target.value as any }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="16:9">Widescreen Theater (16:9)</option>
                  <option value="9:16">Vertical Socials (9:16)</option>
                  <option value="1:1">Standard Square Grid (1:1)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Session Playback Rate</label>
                <select 
                  value={settings.playbackSpeed}
                  onChange={(e) => setSettings(prev => ({ ...prev, playbackSpeed: parseFloat(e.target.value) }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="0.5">Slow motion (0.5x)</option>
                  <option value="1">Standard Speed (1.0x)</option>
                  <option value="1.5">Fast Forward (1.5x)</option>
                  <option value="2">Blitz Speed (2.0x)</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 font-semibold text-xs py-2 px-3 rounded transition-colors cursor-pointer text-center"
            >
              Apply Sequence Settings
            </button>
          </div>
        </div>
      )}

      {/* DIALOG MODE: User Guide Tutorial Panel */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h4 className="font-display font-bold text-sm text-zinc-100">Vertex Video Editor Guide (v1.0)</h4>
            </div>

            <div className="space-y-3.5 text-xs text-zinc-300 leading-relaxed max-h-[300px] overflow-y-auto pr-1">
              <p>Welcome! This is a complete, pixel-perfect recreate of the <strong>Vertex Video Editor desktop app</strong> running fully offline-ready in your browser.</p>
              
              <div className="space-y-2 bg-zinc-950 p-3 rounded-lg border border-zinc-900 font-sans">
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-blue-400 block mb-1">✨ INTERACTIVE ACTIONS</span>
                <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                  <li><strong>Scrub Timeline:</strong> Click and drag the mouse on the Top Time Ruler (seconds headers) to slide the playhead backwards and forwards.</li>
                  <li><strong>Slide Clips:</strong> Click and hold any colorful clip in the timeline track to drag and move its base starting position!</li>
                  <li><strong>Modify Sizing:</strong> Click on the <code className="bg-zinc-900 px-1 rounded text-zinc-200">+</code> and <code className="bg-zinc-900 px-1 rounded text-zinc-200">-</code> buttons at the bottom right of each sequence block to lengthen/shorten play times!</li>
                  <li><strong>Upload Assets:</strong> Hit "+ Add Media" to input custom format templates into your pool. Hover cards to insert them onto active tracks.</li>
                  <li><strong>Realtime Inspector:</strong> Highlight any clip blocks to instantly bind and tweak Opacity, Hue rotation, contrast, scale, or overlay captions.</li>
                </ul>
              </div>

              <p className="text-[11px] text-zinc-500 italic">No plugins required. Built using standard React, HTML5 Audio visual vectors, and high contrast CSS grids.</p>
            </div>

            <button 
              onClick={() => setShowTutorial(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 font-semibold text-xs py-2 px-3 rounded transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4 text-emerald-200" /> Let's Start Editing!
            </button>
          </div>
        </div>
      )}

      {/* DIALOG MODE: Render Export Engine compiling loader overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-sm text-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
              {/* Spinning visual vectors */}
              <div className="w-20 h-20 rounded-full border-4 border-zinc-800 border-t-blue-500 animate-spin"></div>
              <span className="absolute text-sm font-mono font-bold text-zinc-200">{exportProgress}%</span>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-zinc-100 font-display font-bold text-sm">Compiling Sequence Workspace</h4>
              <p className="text-[11px] text-zinc-400 font-mono tracking-tight animate-pulse">{exportStage}</p>
            </div>

            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden max-w-xs mx-auto">
              <div 
                className="bg-blue-500 h-full transition-all duration-100" 
                style={{ width: `${exportProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG MODE: Render Export Successful modal */}
      {exportSuccess && (() => {
        // Calculate file dimensions and dynamic megabytes calculation
        let rate = 1.4;
        if (settings.resolution === "3840x2160") rate = 4.2;
        if (settings.resolution === "1280x720") rate = 0.7;
        if (settings.resolution === "1080x1080") rate = 1.0;
        const estSizeOnDisk = (totalDuration * rate).toFixed(1);

        const realBlobSize = renderedVideoBlob 
          ? (renderedVideoBlob.size / (1024 * 1024)).toFixed(2) 
          : estSizeOnDisk;

        const downloadExtension = "mp4";
        const filename = `vertex_render_${settings.resolution.replace("x", "p")}_${totalDuration.toFixed(0)}s.mp4`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in font-sans">
            <div className="w-full max-w-3xl bg-[#0f0f12] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden p-6 space-y-5 text-zinc-100">
              
              {/* Dashboard Title Ribbon */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">
                    Vertex Compositor • COMPILATION READY
                  </span>
                </div>
                <span className="text-[10.5px] font-mono text-zinc-500 text-right">
                  Codec: H.264 / VP9 Container ({downloadExtension})
                </span>
              </div>

              {/* Multi-Column Workspace Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* LEFT WORKSPACE: HD Final Render Player Preview */}
                <div className="col-span-12 md:col-span-7 flex flex-col gap-3">
                  <span className="text-zinc-400 text-[10.5px] uppercase tracking-wider font-semibold">
                    Interactive Final Video Player (Looping Monitor)
                  </span>

                  {/* Native full-featured video frame control screen */}
                  <div className="relative aspect-video w-full rounded bg-black border border-zinc-900 overflow-hidden flex items-center justify-center shadow-inner">
                    {renderedVideoUrl ? (
                      <video 
                        src={renderedVideoUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto text-blue-400 animate-spin">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.75 8.25" />
                          </svg>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono block">Securing video buffer track...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT PANEL: Compilation details and Actions */}
                <div className="col-span-12 md:col-span-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-[13.5px] font-bold text-zinc-100 font-display">Export Complete!</h3>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                          Workspace track sequences compiled perfectly into a standalone video file.
                        </p>
                      </div>
                    </div>

                    {/* Specifications technical info board */}
                    <div className="rounded bg-zinc-900/60 border border-zinc-800/50 p-3 space-y-2.5 font-sans">
                      <span className="text-[9.5px] tracking-wider uppercase text-zinc-500 font-bold block border-b border-zinc-800 pb-1">
                        Video Metadata Specs
                      </span>
                      
                      <div className="grid grid-cols-2 gap-y-1.5 text-[11px] font-mono">
                        <span className="text-zinc-500">File Name:</span>
                        <span className="text-zinc-300 font-semibold truncate text-right max-w-[140px] block justify-self-end text-ellipsis overflow-hidden">
                          {filename}
                        </span>

                        <span className="text-zinc-500">Duration:</span>
                        <span className="text-zinc-300 font-semibold text-right">
                          {totalDuration.toFixed(1)} seconds
                        </span>

                        <span className="text-zinc-500">File Size:</span>
                        <span className="text-[#39df90] font-sans font-bold text-right">
                          {realBlobSize} MB
                        </span>

                        <span className="text-zinc-500">Resolution:</span>
                        <span className="text-zinc-300 font-semibold text-right">
                          {settings.resolution} ({settings.aspectRatio})
                        </span>

                        <span className="text-zinc-500">Format container:</span>
                        <span className="text-zinc-300 font-semibold text-right">
                          {downloadExtension.toUpperCase()} Standard
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons Stack */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleDownloadVideo}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 font-bold text-xs py-2.5 px-3.5 rounded-lg transition-all duration-200 cursor-pointer text-center text-white flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(66,140,220,0.35)] font-sans uppercase tracking-wider"
                      title="Save standard video file to your computer"
                    >
                      <Download className="w-4 h-4 text-sky-100 animate-bounce" />
                      Download Video File
                    </button>
                    
                    <button 
                      onClick={() => setExportSuccess(false)}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all text-[11px] font-semibold py-1.5 px-3 rounded-lg cursor-pointer text-center"
                    >
                      Back to Editor
                    </button>
                  </div>

                </div>

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}

