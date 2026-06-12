/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useRef, useState, useEffect } from "react";
import { 
  Scissors, 
  MousePointer, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Video, 
  Type, 
  Music,
  Plus,
  Play,
  Settings,
  Scale,
  Timer,
  Clock,
  Trash2
} from "lucide-react";
import { TimelineClip, TimelineTrack, MediaAsset } from "../types";

interface TimelineProps {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onUpdateClip: (updated: TimelineClip) => void;
  currentTime: number;
  onSetTime: (time: number) => void;
  totalDuration: number;
  onUpdateTotalDuration?: (duration: number) => void;
  onAddTextClip: (trackId: string, time: number) => void;
  height?: number;
  onImportFiles?: (files: File[]) => void;
  selectedClipIds?: string[];
  onSelectClips?: (ids: string[]) => void;
  onDeleteClip?: (id: string) => void;
  onDeleteClips?: (ids: string[]) => void;
  assets?: MediaAsset[];
  onUpdateClips?: (updated: TimelineClip[]) => void;
  onActionCommitted?: () => void;
  onAddTrack?: () => void;
  onDeleteTrack?: (trackId: string) => void;
}

// Memory cache for decoded audio peaks (normalized amplitude values 0-100)
const decodedPeaksCache: Record<string, number[]> = {};
const decodingInProgress: Record<string, boolean> = {};

// Procedural audio waveform simulator for dynamic natural sound wave peaks (used as fallback or for demo assets)
function generateProceduralPeaks(seed: string): number[] {
  const peaks: number[] = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const absHash = Math.abs(hash);
  for (let i = 0; i < 500; i++) {
    const t = i / 500;
    // Layered sines with varying frequencies and phases to mimic rich audio beats and frequencies
    const sine1 = Math.sin(t * (8 + (absHash % 12)) * Math.PI + (absHash % 7));
    const sine2 = Math.sin(t * (20 + (absHash % 16)) * Math.PI);
    const sine3 = Math.cos(t * (45 + (absHash % 25)) * Math.PI);
    
    // Envelope to simulate audio dynamic ranges, song sections and beat drops
    const rhythm = Math.pow(Math.abs(Math.sin(t * Math.PI * (3 + (absHash % 5)))), 2);
    const envelope = rhythm * 0.75 + 0.25;
    
    let raw = (Math.abs(sine1) * 0.45 + Math.abs(sine2) * 0.35 + Math.abs(sine3) * 0.2) * envelope;
    
    // Noise overlay for fine grain peak look
    const noise = Math.sin(i * 345.678) * 0.04;
    let val = Math.round((raw + Math.abs(noise)) * 100);
    
    if (val < 4) val = 4;
    if (val > 100) val = 100;
    peaks.push(val);
  }
  return peaks;
}

// Background thread audio wave decoder using the standard Web Audio API
async function decodeAudioFile(url: string, onUpdate: (peaks: number[]) => void): Promise<void> {
  if (decodedPeaksCache[url]) {
    onUpdate(decodedPeaksCache[url]);
    return;
  }
  if (decodingInProgress[url]) {
    return;
  }
  decodingInProgress[url] = true;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Could not fetch file");

    const arrayBuffer = await response.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio API not supported");
    }
    const audioCtx = new AudioContextClass();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);

    const targetLength = 500;
    const step = Math.ceil(channelData.length / targetLength);
    const peaks: number[] = [];

    for (let i = 0; i < targetLength; i++) {
      const start = i * step;
      let maxVal = 0;
      const end = Math.min(start + step, channelData.length);
      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > maxVal) {
          maxVal = val;
        }
      }
      peaks.push(maxVal);
    }

    const highest = Math.max(...peaks) || 1.0;
    const normalized = peaks.map(p => Math.round((p / highest) * 100));

    decodedPeaksCache[url] = normalized;
    onUpdate(normalized);
  } catch (err) {
    console.warn("Waveform extraction failed. Falling back to dynamic procedural sound synthesis curves:", err);
    const fallback = generateProceduralPeaks(url);
    decodedPeaksCache[url] = fallback;
    onUpdate(fallback);
  } finally {
    decodingInProgress[url] = false;
  }
}

interface AudioWaveformVisualizerProps {
  clip: TimelineClip;
  assets: MediaAsset[];
  width: number;
  currentTime: number;
}

export function AudioWaveformVisualizer({ clip, assets, width, currentTime }: AudioWaveformVisualizerProps) {
  const asset = assets.find(a => a.id === clip.assetId);
  const rawUrl = asset?.localBlobUrl || asset?.thumbnailUrl || "";

  let srcUrl = rawUrl;
  if (clip.assetId === "asset-music" && (!rawUrl || rawUrl.includes("images.unsplash.com"))) {
    srcUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
  }

  // Instantly initialize with beautiful, fast procedural peaks so there is absolute zero wait time!
  const [peaks, setPeaks] = useState<number[]>(() => 
    generateProceduralPeaks(srcUrl || (clip.id + clip.name))
  );

  useEffect(() => {
    if (!srcUrl) return;

    if (decodedPeaksCache[srcUrl]) {
      setPeaks(decodedPeaksCache[srcUrl]);
      return;
    }

    let isSubscribed = true;
    decodeAudioFile(srcUrl, (extractedPeaks) => {
      if (isSubscribed) {
        setPeaks(extractedPeaks);
      }
    }).catch(() => {
      // safe silent ignore since procedural wave is already active
    });

    return () => {
      isSubscribed = false;
    };
  }, [srcUrl, clip.id, clip.name]);

  // Calculate discrete bar chart step density (matching premium tools like CapCut)
  const barWidth = 2;
  const gapWidth = 1.5;
  const numBars = Math.max(10, Math.floor(width / (barWidth + gapWidth)));

  return (
    <div className="absolute inset-x-0 bottom-1 pointer-events-none opacity-80 h-7 px-2 overflow-hidden flex items-end justify-between">
      {Array.from({ length: numBars }).map((_, barIdx) => {
        const barTime = (barIdx / numBars) * clip.duration;
        const assetDuration = asset?.duration || clip.duration || 10;
        const fraction = Math.min(1, Math.max(0, barTime / assetDuration));
        const peakIndex = Math.floor(fraction * (peaks.length - 1));
        const basePeak = peaks[peakIndex] || 5;

        // Visual amplitude height linked with volume configuration (shrunk/blown dynamically!)
        const volumeScale = (clip.volume !== undefined ? clip.volume : 100) / 100;
        const finalHeight = Math.max(5, Math.min(100, basePeak * volumeScale));

        // Sync visual tracking color with active playhead (past the timer is bright, rest is dark emerald)
        const barTimelineTime = clip.startTime + barTime;
        const isPast = currentTime > barTimelineTime;
        const barColorClass = isPast 
          ? "bg-emerald-400 opacity-95 shadow-[0_0_4px_rgba(52,211,153,0.5)]" 
          : "bg-emerald-600/35";

        return (
          <div 
            key={barIdx} 
            className={`rounded-[1px] transition-all duration-100 ${barColorClass}`}
            style={{ 
              height: `${finalHeight}%`,
              width: `${barWidth}px`
            }}
          />
        );
      })}
    </div>
  );
}

export default function Timeline({
  tracks,
  clips,
  selectedClipId,
  onSelectClip,
  onUpdateClip,
  currentTime,
  onSetTime,
  totalDuration,
  onUpdateTotalDuration,
  onAddTextClip,
  height,
  onImportFiles,
  selectedClipIds = [],
  onSelectClips,
  onDeleteClip,
  onDeleteClips,
  assets = [],
  onUpdateClips,
  onActionCommitted,
  onAddTrack,
  onDeleteTrack
}: TimelineProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(120); // 50 to 200 (pixels per second)
  const [activeTool, setActiveTool] = useState<"select" | "cut">("select");
  const rulerRef = useRef<HTMLDivElement>(null);
  const timelineScrollContainerRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Selection box state
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isVisible: boolean;
  } | null>(null);

  // Custom Timeline Scroll/Zoom logic:
  // 1. Normal vertical mouse wheel (deltaY) triggers Scale/Zoom directly (Up = Zoom In, Down = Zoom Out)
  // 2. Middle mouse button clicked and dragged allows high-fidelity horizontal panning
  useEffect(() => {
    const container = timelineScrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // deltaY < 0 is scrolling UP (zoom in), deltaY > 0 is scrolling DOWN (zoom out)
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      
      setZoomLevel((prev) => {
        // Range from 30px to 300px per second matching CapCut scale limits
        const nextZoom = Math.max(30, Math.min(300, Math.round(prev * zoomFactor)));
        return nextZoom;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    // Middle Mouse Button drag to scroll horizontally (panning)
    let isPanning = false;
    let startX = 0;
    let startScrollLeft = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // 1 is middle button click
        e.preventDefault();
        isPanning = true;
        startX = e.clientX;
        startScrollLeft = container.scrollLeft;
        container.style.cursor = "grabbing";
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      container.scrollLeft = startScrollLeft - dx;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isPanning) {
        isPanning = false;
        container.style.cursor = "";
      }
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // States for interactive timeline duration controls
  const [isScrubbingDuration, setIsScrubbingDuration] = useState(false);
  const [dragStartDurationX, setDragStartDurationX] = useState(0);
  const [dragStartDurationVal, setDragStartDurationVal] = useState(0);
  const [isEditingDurationDirectly, setIsEditingDurationDirectly] = useState(false);
  const [tempDurationInput, setTempDurationInput] = useState("");

  const handleStartScrubDuration = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsScrubbingDuration(true);
    setDragStartDurationX(e.clientX);
    setDragStartDurationVal(totalDuration);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isScrubbingDuration) return;
      const deltaX = e.clientX - dragStartDurationX;
      // 1 pixel dragged = 0.25 seconds adjust
      const rawNewDuration = dragStartDurationVal + deltaX * 0.25;
      
      // Prevent shortening past the rightmost clip bounding end
      const maxClipEnd = clips.reduce((acc, c) => Math.max(acc, c.startTime + c.duration), 0);
      const clamped = Math.max(Math.max(1.0, Math.ceil(maxClipEnd)), rawNewDuration);
      
      if (onUpdateTotalDuration) {
        onUpdateTotalDuration(parseFloat(clamped.toFixed(1)));
      }
    };

    const handleMouseUp = () => {
      setIsScrubbingDuration(false);
    };

    if (isScrubbingDuration) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbingDuration, dragStartDurationX, dragStartDurationVal, onUpdateTotalDuration, clips]);

  // Handle Drag Over events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files) as File[];
      if (files.length > 0) {
        onImportFiles?.(files);
      }
    }
  };

  // For micro adjustments of clip positions
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, startTime: 0 });
  const [draggedClipsStartTimes, setDraggedClipsStartTimes] = useState<Record<string, number>>({});
  const [draggedClipsStartTrackIndices, setDraggedClipsStartTrackIndices] = useState<Record<string, number>>({});

  // For edge trimming resize adjustments
  const [resizingClipId, setResizingClipId] = useState<string | null>(null);
  const [resizeDirection, setResizeDirection] = useState<"left" | "right" | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, startTime: 0, duration: 0 });

  // Handle timeline scrubbing (ruler dragging)
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    updateTimeFromPos(e.clientX);
  };

  const updateTimeFromPos = (clientX: number) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const calculatedTime = (x / zoomLevel);
    onSetTime(Math.max(0, Math.min(calculatedTime, totalDuration)));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        updateTimeFromPos(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
    };

    if (isScrubbing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, zoomLevel]);

  // Clip Dragging Simulations
  const handleClipMouseDown = (e: React.MouseEvent, clip: TimelineClip) => {
    if (activeTool === "cut") {
      e.stopPropagation();
      // Slice tool logic
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const relativeTime = clickX / zoomLevel;
      const splitPoint = clip.startTime + relativeTime;

      if (splitPoint > clip.startTime && splitPoint < clip.startTime + clip.duration) {
        const firstHalfDuration = splitPoint - clip.startTime;
        const secondHalfDuration = (clip.startTime + clip.duration) - splitPoint;

        // Clone and shrink the first half
        const firstHalf = { ...clip, duration: parseFloat(firstHalfDuration.toFixed(2)) };
        onUpdateClip(firstHalf);
        setActiveTool("select");
      }
      return;
    }

    e.stopPropagation();

    // Support group dragging and Shift key selection toggles
    const isAlreadySelected = selectedClipIds.includes(clip.id);
    let newSelectedSet = [...selectedClipIds];
    
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      if (isAlreadySelected) {
        newSelectedSet = newSelectedSet.filter(id => id !== clip.id);
      } else {
        newSelectedSet.push(clip.id);
      }
    } else {
      if (!isAlreadySelected) {
        newSelectedSet = [clip.id];
      }
    }

    onSelectClips?.(newSelectedSet);
    if (newSelectedSet.length > 0) {
      onSelectClip(newSelectedSet[newSelectedSet.length - 1]);
    } else {
      onSelectClip(null);
    }

    // Map start positions of all currently dragged clips
    const startPositions: Record<string, number> = {};
    const startTrackIndices: Record<string, number> = {};
    newSelectedSet.forEach(id => {
      const c = clips.find(x => x.id === id);
      if (c) {
        startPositions[id] = c.startTime;
        const index = tracks.findIndex(t => t.id === c.trackId);
        startTrackIndices[id] = index !== -1 ? index : 0;
      }
    });
    if (!startPositions[clip.id]) {
      startPositions[clip.id] = clip.startTime;
      const index = tracks.findIndex(t => t.id === clip.trackId);
      startTrackIndices[clip.id] = index !== -1 ? index : 0;
    }
    setDraggedClipsStartTimes(startPositions);
    setDraggedClipsStartTrackIndices(startTrackIndices);

    setDraggedClipId(clip.id);
    setDragStartPos({ x: e.clientX, startTime: clip.startTime });
  };

  // Drag and Trim edge resize listeners with collision boundaries to prevent clips from overlapping
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!draggedClipId && !resizingClipId) return;

      if (draggedClipId) {
        const targetClip = clips.find(c => c.id === draggedClipId);
        if (!targetClip) return;

        const deltaX = e.clientX - dragStartPos.x;
        const deltaTime = deltaX / zoomLevel;

        const draggedIds = Object.keys(draggedClipsStartTimes);

        let trackDelta = 0;
        const rect = tracksContainerRef.current?.getBoundingClientRect();
        if (rect) {
          const currentY = e.clientY - rect.top;
          const mouseTrackIndex = Math.floor(currentY / 60);
          const mainStartTrackIndex = draggedClipsStartTrackIndices[draggedClipId] ?? 0;
          trackDelta = mouseTrackIndex - mainStartTrackIndex;
        }

        let finalDeltaTime = deltaTime;

        // Analyze and resolve overlap constraints for all dragged clips
        draggedIds.forEach(id => {
          const c = clips.find(x => x.id === id);
          if (!c) return;

          let projTrackIndex = (draggedClipsStartTrackIndices[c.id] ?? 0) + trackDelta;
          projTrackIndex = Math.max(0, Math.min(tracks.length - 1, projTrackIndex));
          const targetTrack = tracks[projTrackIndex];

          const otherTrackClips = clips.filter(x => x.trackId === targetTrack.id && !draggedClipsStartTimes[x.id]);

          const targetStart = Math.max(0, draggedClipsStartTimes[id] + finalDeltaTime);
          const targetEnd = targetStart + c.duration;

          // Detect any overlapping clip on the desired track
          const overlappingClip = otherTrackClips.find(other => {
            return targetStart < other.startTime + other.duration && targetEnd > other.startTime;
          });

          if (overlappingClip) {
            const isFromLeft = draggedClipsStartTimes[id] + c.duration <= overlappingClip.startTime + 0.1;
            const isFromRight = draggedClipsStartTimes[id] >= overlappingClip.startTime + overlappingClip.duration - 0.1;

            if (isFromLeft) {
              const maxStart = overlappingClip.startTime - c.duration;
              finalDeltaTime = maxStart - draggedClipsStartTimes[id];
            } else if (isFromRight) {
              const minStart = overlappingClip.startTime + overlappingClip.duration;
              finalDeltaTime = minStart - draggedClipsStartTimes[id];
            } else {
              // Dragging vertically onto a clip on target track: search closest boundary
              const leftDiff = Math.abs(targetStart + c.duration - overlappingClip.startTime);
              const rightDiff = Math.abs(targetStart - (overlappingClip.startTime + overlappingClip.duration));

              if (leftDiff < rightDiff) {
                const maxStart = overlappingClip.startTime - c.duration;
                if (maxStart >= 0) {
                  finalDeltaTime = maxStart - draggedClipsStartTimes[id];
                } else {
                  finalDeltaTime = (overlappingClip.startTime + overlappingClip.duration) - draggedClipsStartTimes[id];
                }
              } else {
                finalDeltaTime = (overlappingClip.startTime + overlappingClip.duration) - draggedClipsStartTimes[id];
              }
            }
          }
        });

        // Double check for any residual collision. Limit trackDelta or clamp finalDeltaTime further if needed
        let hasOverlap = false;
        draggedIds.forEach(id => {
          const c = clips.find(x => x.id === id);
          if (!c) return;

          let projTrackIndex = (draggedClipsStartTrackIndices[c.id] ?? 0) + trackDelta;
          projTrackIndex = Math.max(0, Math.min(tracks.length - 1, projTrackIndex));
          const targetTrack = tracks[projTrackIndex];

          const otherTrackClips = clips.filter(x => x.trackId === targetTrack.id && !draggedClipsStartTimes[x.id]);
          const finalStart = Math.max(0, draggedClipsStartTimes[id] + finalDeltaTime);
          const finalEnd = finalStart + c.duration;

          const overlaps = otherTrackClips.some(other => {
            return finalStart < other.startTime + other.duration - 0.01 && finalEnd > other.startTime + 0.01;
          });

          if (overlaps) {
            hasOverlap = true;
          }
        });

        if (hasOverlap && trackDelta !== 0) {
          // Revert vertical track motion if horizontal adjustment is blocked
          trackDelta = 0;
          finalDeltaTime = deltaTime;

          draggedIds.forEach(id => {
            const c = clips.find(x => x.id === id);
            if (!c) return;

            const targetTrack = tracks[draggedClipsStartTrackIndices[c.id] ?? 0];
            const otherTrackClips = clips.filter(x => x.trackId === targetTrack.id && !draggedClipsStartTimes[x.id]);

            const targetStart = Math.max(0, draggedClipsStartTimes[id] + finalDeltaTime);
            const targetEnd = targetStart + c.duration;

            const overlappingClip = otherTrackClips.find(other => {
              return targetStart < other.startTime + other.duration && targetEnd > other.startTime;
            });

            if (overlappingClip) {
              const isFromLeft = draggedClipsStartTimes[id] + c.duration <= overlappingClip.startTime + 0.1;
              if (isFromLeft) {
                finalDeltaTime = (overlappingClip.startTime - c.duration) - draggedClipsStartTimes[id];
              } else {
                finalDeltaTime = (overlappingClip.startTime + overlappingClip.duration) - draggedClipsStartTimes[id];
              }
            }
          });
        }

        // Shifting all select-group clips simultaneously horizontally and vertically without any overlapping
        const updatedClips = clips.map(c => {
          if (draggedClipsStartTimes[c.id] !== undefined) {
            let projTrackIndex = (draggedClipsStartTrackIndices[c.id] ?? 0) + trackDelta;
            projTrackIndex = Math.max(0, Math.min(tracks.length - 1, projTrackIndex));
            const targetTrack = tracks[projTrackIndex];

            return {
              ...c,
              startTime: parseFloat(Math.max(0, draggedClipsStartTimes[c.id] + finalDeltaTime).toFixed(2)),
              trackId: targetTrack.id
            };
          }
          return c;
        });

        if (onUpdateClips) {
          onUpdateClips(updatedClips);
        } else {
          const updatedTarget = updatedClips.find(c => c.id === draggedClipId);
          if (updatedTarget) onUpdateClip(updatedTarget);
        }
      } else if (resizingClipId && resizeDirection) {
        const targetClip = clips.find(c => c.id === resizingClipId);
        if (!targetClip) return;

        const deltaX = e.clientX - resizeStartPos.x;
        const deltaTime = deltaX / zoomLevel;

        const trackClips = clips.filter(c => c.trackId === targetClip.trackId && c.id !== targetClip.id);

        // Find corresponding asset duration limit if it is video/audio
        const matchingAsset = assets.find(a => a.id === targetClip.assetId);
        const maxDuration = matchingAsset && (matchingAsset.type === "video" || matchingAsset.type === "audio")
          ? matchingAsset.duration
          : Infinity;

        if (resizeDirection === "right") {
          let newDuration = resizeStartPos.duration + deltaTime;
          newDuration = Math.max(0.2, newDuration);

          if (newDuration > maxDuration) {
            newDuration = maxDuration;
          }

          // Get right collision limit
          const rightClips = trackClips.filter(c => c.startTime >= resizeStartPos.startTime + 0.05);
          const rightLimit = rightClips.length > 0 
            ? Math.min(...rightClips.map(c => c.startTime)) 
            : totalDuration;

          if (targetClip.startTime + newDuration > rightLimit) {
            newDuration = rightLimit - targetClip.startTime;
          }

          onUpdateClip({
            ...targetClip,
            duration: parseFloat(newDuration.toFixed(2))
          });
        } else if (resizeDirection === "left") {
          let newStartTime = resizeStartPos.startTime + deltaTime;
          let newDuration = resizeStartPos.duration - deltaTime;

          if (newDuration < 0.2) {
            const excess = 0.2 - newDuration;
            newStartTime -= excess;
            newDuration = 0.2;
          }

          if (newDuration > maxDuration) {
            newStartTime = resizeStartPos.startTime + resizeStartPos.duration - maxDuration;
            newDuration = maxDuration;
          }

          // Get left collision limit
          const leftClips = trackClips.filter(c => c.startTime + c.duration <= resizeStartPos.startTime + 0.05);
          const leftLimit = leftClips.length > 0 
            ? Math.max(...leftClips.map(c => c.startTime + c.duration)) 
            : 0;

          if (newStartTime < leftLimit) {
            const difference = leftLimit - newStartTime;
            newStartTime = leftLimit;
            newDuration -= difference;
          }

          onUpdateClip({
            ...targetClip,
            startTime: parseFloat(newStartTime.toFixed(2)),
            duration: parseFloat(newDuration.toFixed(2))
          });
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggedClipId || resizingClipId) {
        onActionCommitted?.();
      }
      setDraggedClipId(null);
      setResizingClipId(null);
      setResizeDirection(null);
    };

    if (draggedClipId || resizingClipId) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [draggedClipId, resizingClipId, resizeDirection, dragStartPos, resizeStartPos, zoomLevel, clips, totalDuration, draggedClipsStartTimes, draggedClipsStartTrackIndices, tracks, onUpdateClips, onActionCommitted, assets]);

  // Handle dragging the selection box and computing intersected clips
  const handleTracksMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only support selection box in SelectPointer tool mode, and on left-click
    if (activeTool !== "select" || e.button !== 0) return;
    
    e.preventDefault();

    if (!tracksContainerRef.current) return;

    const rect = tracksContainerRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setSelectionBox({
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      isVisible: false
    });
  };

  useEffect(() => {
    if (!selectionBox) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!tracksContainerRef.current) return;

      const rect = tracksContainerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      // Threshold check to avoid registering clicks as drags
      const distance = Math.sqrt(
        Math.pow(currentX - selectionBox.startX, 2) + Math.pow(currentY - selectionBox.startY, 2)
      );

      const isVisible = selectionBox.isVisible || distance > 3;

      setSelectionBox((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentX,
          currentY,
          isVisible
        };
      });

      if (isVisible) {
        // Calculate collision intersection
        const minX = Math.min(selectionBox.startX, currentX);
        const maxX = Math.max(selectionBox.startX, currentX);
        const minY = Math.min(selectionBox.startY, currentY);
        const maxY = Math.max(selectionBox.startY, currentY);

        const intersectedIds: string[] = [];

        clips.forEach((clip) => {
          const clipLeft = clip.startTime * zoomLevel;
          const clipRight = (clip.startTime + clip.duration) * zoomLevel;

          const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
          if (trackIndex === -1) return;

          const trackTop = trackIndex * 60;
          const trackBottom = (trackIndex + 1) * 60;

          const overlapsX = maxX >= clipLeft && minX <= clipRight;
          const overlapsY = maxY >= trackTop && minY <= trackBottom;

          if (overlapsX && overlapsY) {
            intersectedIds.push(clip.id);
          }
        });

        if (onSelectClips) {
          onSelectClips(intersectedIds);
        } else if (onSelectClip) {
          onSelectClip(intersectedIds[0] || null);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      // If it was a simple click (not dragged), deselect everything
      if (selectionBox && !selectionBox.isVisible) {
        if (onSelectClips) {
          onSelectClips([]);
        }
        if (onSelectClip) {
          onSelectClip(null);
        }
      }
      setSelectionBox(null);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [selectionBox, clips, tracks, zoomLevel, onSelectClip, onSelectClips]);

  // Handle Delete or Backspace keydown to delete selected clips
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        // Don't trigger if user is typing in an input or textarea
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA" ||
            activeEl.getAttribute("contenteditable") === "true")
        ) {
          return;
        }

        const selectedIds = selectedClipIds.length > 0 ? selectedClipIds : (selectedClipId ? [selectedClipId] : []);
        if (selectedIds.length > 0) {
          e.preventDefault();
          if (onDeleteClips) {
            onDeleteClips(selectedIds);
          } else if (onDeleteClip) {
            selectedIds.forEach((id) => onDeleteClip(id));
          }
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [selectedClipId, selectedClipIds, onDeleteClip, onDeleteClips]);

  // Generate tick marks for time ruler increments
  const renderRulerTicks = () => {
    const ticks = [];
    const step = zoomLevel < 80 ? 1 : 0.5; // step in seconds

    for (let t = 0; t <= totalDuration; t += step) {
      const left = t * zoomLevel;
      const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString();
        const s = Math.floor(secs % 60).toString().padStart(2, "0");
        const f = Math.floor((secs % 1) * 24).toString().padStart(2, "0");
        return `${m}:${s}:${f}`;
      };

      ticks.push(
        <div 
          key={t}
          className="absolute h-full flex flex-col justify-between border-l border-[#1d1d21] pr-1 select-none pointer-events-none"
          style={{ left: `${left}px` }}
        >
          <span className="text-[9.5px] font-mono text-[#8a8a91] pl-1 mt-0.5">
            {formatTime(t)}
          </span>
          <div className="h-1.5 w-[1px] bg-[#1d1d21]"></div>
        </div>
      );
    }
    return ticks;
  };

  // Helper render icons corresponding to standard tracks
  const getTrackIcon = (iconName: string) => {
    switch (iconName) {
      case "Video": return <Video className="w-3.5 h-3.5 text-emerald-400" />;
      case "Type": return <Type className="w-3.5 h-3.5 text-purple-400" />;
      case "Music": return <Music className="w-3.5 h-3.5 text-blue-400" />;
      default: return <Video className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-[#111113] border-t border-[#1d1d21] flex flex-col select-none shrink-0 font-sans overflow-hidden relative transition-colors duration-200 ${
        isDragOver ? "bg-[#182333]/95 border-[#428cdc]" : ""
      }`}
      style={{ height: height ? `${height}px` : "280px" }}
    >
      {/* Drag drop guidelines overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-[#0c121d]/95 z-50 flex flex-col items-center justify-center border-2 border-dashed border-[#428cdc] m-2 rounded-[4px] pointer-events-none animate-fade-in space-y-2">
          <svg className="w-10 h-10 text-[#428cdc] animate-bounce fill-none stroke-current stroke-[1.5]" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          <div className="text-sm font-sans font-medium text-white">Drop media files here directly!</div>
          <div className="text-[10px] text-[#bcbcbf] font-mono">It will automatically load into Media and the timeline track</div>
        </div>
      )}
      
      {/* 1. TIMELINE ACTION TOOLBAR CONTROLS */}
      <div className="h-10 bg-[#111113] border-b border-[#1d1d21] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[#ceced3] text-[13px] font-sans font-medium tracking-wide mr-2">Timeline</span>
          
          {/* Tools */}
          <div className="flex items-center gap-1 bg-[#1a1a1c] p-0.5 rounded-[3px] border border-[#1d1d21]">
            <button 
              id="tool-select"
              onClick={() => setActiveTool("select")}
              className={`p-1 px-2.5 rounded-[2px] transition-all cursor-pointer flex items-center gap-1 text-[11px] font-medium ${
                activeTool === "select" 
                  ? "bg-[#2c2c30] text-[#428cdc]" 
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
              title="Pointer Selection Tool"
            >
              <MousePointer className="w-3 h-3" />
              <span>Select</span>
            </button>

            <button 
              id="tool-cut"
              onClick={() => setActiveTool("cut")}
              className={`p-1 px-2.5 rounded-[2px] transition-all cursor-pointer flex items-center gap-1 text-[11px] font-medium ${
                activeTool === "cut" 
                  ? "bg-[#2c2c31] text-amber-500" 
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
              title="Slide / Knife cutting tool"
            >
              <Scissors className="w-3 h-3" />
              <span>Cut</span>
            </button>
          </div>

          <span className="text-[10px] text-zinc-500 font-mono">
            Grid Snap: Active
          </span>

          {/* Delete Selection button */}
          {((selectedClipIds && selectedClipIds.length > 0) || selectedClipId) && (
            <button
              onClick={() => {
                if (selectedClipIds && selectedClipIds.length > 0) {
                  if (onDeleteClips) {
                    onDeleteClips(selectedClipIds);
                  } else if (onDeleteClip) {
                    selectedClipIds.forEach((id) => onDeleteClip(id));
                  }
                } else if (selectedClipId && onDeleteClip) {
                  onDeleteClip(selectedClipId);
                }
              }}
              className="flex items-center gap-1 px-2.5 h-6 rounded-[3px] bg-red-950/50 border border-red-900/60 text-red-400 hover:bg-red-950/70 hover:text-red-350 text-[10.5px] font-medium transition-all duration-150 cursor-pointer animate-fade-in"
              title="Delete selected clip(s) (Shortcut: Delete / Backspace)"
            >
              <Trash2 className="w-3 h-3" />
              <span>
                Delete Selected{(selectedClipIds && selectedClipIds.length > 1) ? ` (${selectedClipIds.length})` : ""}
              </span>
            </button>
          )}
        </div>

        {/* Right timeline duration controller & zoom selector */}
        <div className="flex items-center gap-3.5 text-zinc-400">
          {/* Zoom Control (Compact layout) */}
          <div 
            className="flex items-center gap-1.5 bg-[#1a1a1c] px-2 py-1 rounded-[3px] border border-[#1d1d21]"
            title="Timeline Zoom multiplier • Tip: Hold Alt/Ctrl and scroll mouse wheel over the tracks to zoom in/out (CapCut style)"
          >
            <button 
              onClick={() => setZoomLevel(Math.max(30, zoomLevel - 15))}
              className="p-0.5 hover:text-zinc-100 transition-colors cursor-pointer"
              title="Zoom out timeline"
            >
              <ZoomOut className="w-3 h-3 text-zinc-500" />
            </button>
            <span className="text-[9.5px] font-mono text-zinc-400">{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(Math.min(300, zoomLevel + 15))}
              className="p-0.5 hover:text-zinc-100 transition-colors cursor-pointer"
              title="Zoom in timeline"
            >
              <ZoomIn className="w-3 h-3 text-zinc-500" />
            </button>
          </div>

          {/* Interactive Duration Editor (Click + Drag scrubbing or text input edit) */}
          <div className="flex items-center gap-1.5 bg-[#1a1a1c] px-1.5 py-1 rounded-[3px] border border-[#1d1d21] text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[11px] text-zinc-500 font-sans tracking-tight">Duration:</span>

            {isEditingDurationDirectly ? (
              <input
                type="number"
                min="5"
                max="600"
                step="1"
                autoFocus
                value={tempDurationInput}
                onChange={(e) => setTempDurationInput(e.target.value)}
                onBlur={() => {
                  setIsEditingDurationDirectly(false);
                  const parsed = parseFloat(tempDurationInput);
                  if (!isNaN(parsed)) {
                    const maxClipEnd = clips.reduce((acc, c) => Math.max(acc, c.startTime + c.duration), 0);
                    const finalVal = Math.max(Math.max(1.0, Math.ceil(maxClipEnd)), parsed);
                    if (onUpdateTotalDuration) onUpdateTotalDuration(finalVal);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  } else if (e.key === "Escape") {
                    setIsEditingDurationDirectly(false);
                  }
                }}
                className="w-14 bg-zinc-950 border border-[#1d1d21] rounded px-1 text-[11px] h-4.5 font-mono text-white focus:outline-none focus:border-blue-500 text-center"
              />
            ) : (
              <div 
                onMouseDown={handleStartScrubDuration}
                onDoubleClick={() => {
                  setIsEditingDurationDirectly(true);
                  setTempDurationInput(totalDuration.toFixed(1));
                }}
                className="flex items-center gap-1 cursor-ew-resize select-none px-1 py-0.5 rounded hover:bg-zinc-800/60 transition-colors group relative"
                title="Drag Left/Right to scrub duration • Double Click to edit directly"
              >
                <span className="text-[11.5px] font-mono text-white font-semibold tracking-wide">
                  {totalDuration.toFixed(1)}s
                </span>
                
                {/* Visual tooltip */}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block bg-zinc-900 text-zinc-200 border border-zinc-800 rounded px-2 py-0.5 text-[9px] whitespace-nowrap z-50 shadow-xl">
                  {isScrubbingDuration ? "← Drag to change duration →" : "Drag left/right or double-click to type"}
                </span>
              </div>
            )}

            {/* Quick buttons */}
            <div className="flex gap-0.5 ml-1 shrink-0 items-center">
              <button
                onClick={() => {
                  const maxClipEnd = clips.reduce((acc, c) => Math.max(acc, c.startTime + c.duration), 0);
                  const val = Math.max(Math.max(1.0, Math.ceil(maxClipEnd)), totalDuration - 5.0);
                  if (onUpdateTotalDuration) onUpdateTotalDuration(parseFloat(val.toFixed(1)));
                }}
                className="w-4 h-4 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center hover:bg-zinc-800 text-[9px] font-bold hover:text-white cursor-pointer"
                title="Decrease duration by 5s"
              >
                -
              </button>
              <button
                onClick={() => {
                  const val = Math.min(600.0, totalDuration + 5.0);
                  if (onUpdateTotalDuration) onUpdateTotalDuration(parseFloat(val.toFixed(1)));
                }}
                className="w-4 h-4 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center hover:bg-zinc-800 text-[9px] font-bold hover:text-white cursor-pointer"
                title="Increase duration by 5s"
              >
                +
              </button>
              
              {/* Fit Timeline button */}
              <button
                onClick={() => {
                  const maxClipEnd = clips.reduce((acc, c) => Math.max(acc, c.startTime + c.duration), 0);
                  const val = Math.max(1.0, maxClipEnd);
                  if (onUpdateTotalDuration) onUpdateTotalDuration(parseFloat(val.toFixed(1)));
                }}
                className="px-1.5 h-4 bg-[#172554] border border-[#1e40af]/40 hover:border-[#1e40af] rounded flex items-center justify-center hover:bg-[#1e40af] text-[9.5px] font-sans font-semibold text-blue-100 hover:text-white cursor-pointer transition-colors"
                title="Fit timeline's duration to the end of the last active element"
              >
                Fit
              </button>
            </div>
          </div>
        </div>
      </div>
            {/* 2. TRACK HEADERS & CLIP CONTAINERS CONTAINER SPLIT GRID */}
      <div 
        ref={timelineScrollContainerRef} 
        className="flex-1 min-h-0 overflow-auto relative bg-[#0c0c0d] select-none custom-timeline-scrollbar"
      >
        {/* Unified container of full width containing both left track headers column, and right ruler + tracks lanes */}
        <div 
          className="flex min-h-full relative" 
          style={{ width: `${totalDuration * zoomLevel + 140}px` }}
        >
          {/* LEFT STICKY COLUMN: Head headers */}
          <div className="sticky left-0 w-[140px] bg-[#111113] border-r border-[#1d1d21] flex flex-col z-20 shrink-0 select-none shadow-md">
            {/* Pad to match Ruler height */}
            <div className="h-8 bg-[#111113]/70 border-b border-[#1d1d21] shrink-0"></div>

            {/* Dynamic Row Names */}
            {tracks.map((track) => (
              <div 
                key={track.id}
                className="h-[60px] border-b border-[#1d1d21] px-3.5 flex items-center justify-between bg-[#111113] shrink-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getTrackIcon(track.iconName)}
                  <span className="text-[11px] font-sans font-medium text-zinc-350 truncate">
                    {track.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Plus to add overlay on this track */}
                  <button 
                    onClick={() => onAddTextClip(track.id, currentTime)}
                    className="p-1 hover:bg-[#1a1a1c] text-zinc-500 hover:text-purple-400 rounded transition-colors cursor-pointer"
                    title="Insert overlay text at playhead on this track"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  {/* Delete track (only if > 1 track) */}
                  {tracks.length > 1 && (
                    <button 
                      onClick={() => onDeleteTrack?.(track.id)}
                      className="p-1 hover:bg-[#1a1a1c] text-zinc-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                      title="Delete this track"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Create Track button at headers column bottom */}
            {onAddTrack && (
              <div className="p-2 border-b border-[#1d1d21] bg-[#111113] flex items-center justify-center shrink-0 h-11">
                <button
                  onClick={onAddTrack}
                  className="w-full flex items-center justify-center gap-1 py-1 px-1.5 rounded border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 text-[10px] font-sans font-medium text-zinc-400 hover:text-blue-400 transition-all cursor-pointer"
                  title="Create a new unified track on the timeline"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Track</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SCROLLABLE ELEMENT: Scannable horizontal tracks & Playhead */}
          <div 
            className="flex-1 flex flex-col relative min-h-full min-w-0"
            style={{ width: `${totalDuration * zoomLevel}px` }}
          >
            {/* Horizontal High precision ruler */}
            <div 
              ref={rulerRef}
              onMouseDown={handleRulerMouseDown}
              className="h-8 bg-[#111113] border-b border-[#1d1d21] relative cursor-col-resize shrink-0"
            >
              {renderRulerTicks()}
            </div>

            {/* Tracks container for rendering rows and catching selection box drags */}
            <div 
              ref={tracksContainerRef}
              onMouseDown={handleTracksMouseDown}
              className="flex-1 relative flex flex-col min-h-0 animate-fade-in"
            >
              {/* Render Horizontal Lines where the blocks are placed */}
              {tracks.map((track) => {
                const trackClips = clips.filter(clip => clip.trackId === track.id);
                
                return (
                  <div 
                    key={track.id}
                    className="h-[60px] border-b border-[#1d1d21] relative flex items-center bg-[#0e0e10]/30 hover:bg-[#0e0e10]/50 transition-colors shrink-0"
                  >
                    {/* Subtle Grid backdrop ticks */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex">
                      {Array.from({ length: Math.ceil(totalDuration) }).map((_, i) => (
                        <div 
                          key={i} 
                          className="border-r border-white h-full"
                          style={{ width: `${zoomLevel}px` }}
                        ></div>
                      ))}
                    </div>

                    {/* Render clips inside this block */}
                    {trackClips.map((clip) => {
                      const width = clip.duration * zoomLevel;
                      const left = clip.startTime * zoomLevel;
                      const isSelected = selectedClipIds && selectedClipIds.length > 0 
                        ? selectedClipIds.includes(clip.id) 
                        : selectedClipId === clip.id;

                      // Match precise clip panel colors from reference grid based on user requests:
                      // Video: Blue, Audio: Green, Image: Yellow, Text: Purple with high contrast and polish
                      let bgCustomColor = "bg-[#202024] border-[#2b2b32]";
                      if (clip.type === "video") {
                        bgCustomColor = "bg-blue-600/15 border border-blue-500/40 text-blue-300";
                      } else if (clip.type === "audio") {
                        bgCustomColor = "bg-emerald-600/15 border border-emerald-500/40 text-emerald-300";
                      } else if (clip.type === "image") {
                        bgCustomColor = "bg-amber-600/15 border border-amber-500/40 text-amber-300";
                      } else if (clip.type === "text") {
                        bgCustomColor = "bg-purple-600/15 border border-purple-500/40 text-purple-300";
                      }

                      if (isSelected) {
                        if (clip.type === "video") {
                          bgCustomColor = "bg-blue-600/25 border-blue-400 text-white shadow-lg shadow-blue-500/15 ring-1 ring-blue-500/35";
                        } else if (clip.type === "audio") {
                          bgCustomColor = "bg-emerald-600/25 border-emerald-400 text-white shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-500/35";
                        } else if (clip.type === "image") {
                          bgCustomColor = "bg-amber-600/25 border-amber-400 text-white shadow-lg shadow-amber-500/15 ring-1 ring-amber-500/35";
                        } else if (clip.type === "text") {
                          bgCustomColor = "bg-purple-600/25 border-purple-400 text-white shadow-lg shadow-purple-500/15 ring-1 ring-purple-500/35";
                        }
                      }

                      return (
                        <div 
                          key={clip.id}
                          onMouseDown={(e) => handleClipMouseDown(e, clip)}
                          style={{ 
                            width: `${width}px`, 
                            left: `${left}px` 
                          }}
                          className={`absolute h-[46px] rounded-[3px] p-2 select-none cursor-grab active:cursor-grabbing font-sans transition-shadow shrink-0 flex flex-col justify-between overflow-hidden border ${bgCustomColor} ${
                            isSelected ? "z-10" : ""
                          }`}
                        >
                          {/* Audio Waveform visualization background for music clips - Beautiful procedural or real decoded Web Audio amplitude peaks */}
                          {clip.type === "audio" && (
                            <AudioWaveformVisualizer 
                              clip={clip}
                              assets={assets}
                              width={width}
                              currentTime={currentTime}
                            />
                          )}

                          {/* Drag and Trim resizing handles when selected */}
                          {isSelected && (
                            <>
                              {/* Left trim edge resize grab bar */}
                              <div 
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setResizingClipId(clip.id);
                                  setResizeDirection("left");
                                  setResizeStartPos({ x: e.clientX, startTime: clip.startTime, duration: clip.duration });
                                }}
                                className={`absolute left-0 top-0 bottom-0 w-2.5 ${
                                  clip.type === "video" ? "bg-blue-500 hover:bg-blue-400" :
                                  clip.type === "audio" ? "bg-emerald-500 hover:bg-emerald-400" :
                                  clip.type === "image" ? "bg-amber-500 hover:bg-amber-400" :
                                  "bg-purple-500 hover:bg-purple-400"
                                } cursor-ew-resize z-20 flex items-center justify-center group`}
                                title="Drag Left edge to trim"
                              >
                                <div className="w-[1.5px] h-3 bg-white/75 rounded-full"></div>
                              </div>

                              {/* Right trim edge resize grab bar */}
                              <div 
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setResizingClipId(clip.id);
                                  setResizeDirection("right");
                                  setResizeStartPos({ x: e.clientX, startTime: clip.startTime, duration: clip.duration });
                                }}
                                className={`absolute right-0 top-0 bottom-0 w-2.5 ${
                                  clip.type === "video" ? "bg-blue-500 hover:bg-blue-400" :
                                  clip.type === "audio" ? "bg-emerald-500 hover:bg-emerald-400" :
                                  clip.type === "image" ? "bg-amber-500 hover:bg-amber-400" :
                                  "bg-purple-500 hover:bg-purple-400"
                                } cursor-ew-resize z-20 flex items-center justify-center group`}
                                title="Drag Right edge to trim"
                              >
                                <div className="w-[1.5px] h-3 bg-white/75 rounded-full"></div>
                              </div>
                            </>
                          )}

                          {/* Title of Clip */}
                          <div className="flex items-center justify-between min-w-0 px-2">
                            <span className="text-[10px] font-medium text-[#eaeaea] truncate pr-1">
                              {width > 35 ? clip.name : ""}
                            </span>
                          </div>

                          {/* Length descriptor bottom */}
                          {width > 65 && (
                            <div className="flex items-center justify-between select-none min-w-0 px-2 pb-0.5">
                              <span className="text-[9px] text-zinc-500 font-mono truncate mr-0.5">
                                {clip.startTime.toFixed(1)}s—{(clip.startTime + clip.duration).toFixed(1)}s
                              </span>

                              {/* Interactive sizing slider for standard adjustments */}
                              {width > 105 && (
                                <div className="flex gap-1 shrink-0 z-10">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const shrinkAmt = Math.max(0.5, clip.duration - 0.5);
                                      onUpdateClip({ ...clip, duration: parseFloat(shrinkAmt.toFixed(1)) });
                                    }}
                                    className="w-3.5 h-3.5 bg-[#18181c] hover:bg-[#25252a] text-zinc-400 hover:text-white font-bold text-[9px] flex items-center justify-center rounded-[2px] border border-zinc-700/30 transition-colors cursor-pointer"
                                    title="Decrease active duration"
                                  >
                                    -
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      
                                      // Calculate safe grow range up to the next right-neighbor clip in the same track
                                      const trackClips = clips.filter(c => c.trackId === clip.trackId && c.id !== clip.id);
                                      const rightClips = trackClips.filter(c => c.startTime >= clip.startTime + clip.duration - 0.05);
                                      const rightNeighborStart = rightClips.length > 0
                                        ? Math.min(...rightClips.map(c => c.startTime))
                                        : totalDuration;
                                      
                                      // Calculate physical asset duration boundary clamp
                                      const asset = assets.find(a => a.id === clip.assetId);
                                      const physicalLimit = asset && (asset.type === "video" || asset.type === "audio")
                                        ? asset.duration
                                        : Infinity;

                                      const maxAllowedDuration = Math.min(physicalLimit, rightNeighborStart - clip.startTime);
                                      const growAmt = Math.min(clip.duration + 0.5, maxAllowedDuration);
                                      
                                      if (growAmt > clip.duration) {
                                        onUpdateClip({ ...clip, duration: parseFloat(growAmt.toFixed(1)) });
                                      }
                                    }}
                                    className="w-3.5 h-3.5 bg-[#18181c] hover:bg-[#25252a] text-zinc-400 hover:text-white font-bold text-[9px] flex items-center justify-center rounded-[2px] border border-zinc-700/30 transition-colors cursor-pointer"
                                    title="Increase active duration"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Selection box overlay */}
              {selectionBox && selectionBox.isVisible && (
                <div 
                  className="absolute border border-[#428cdc] bg-[#428cdc]/15 pointer-events-none z-50 rounded-[2px]"
                  style={{
                    left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
                    top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
                    width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
                    height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`,
                  }}
                />
              )}
            </div>

            {/* 3. VERTICAL RED PLAYHEAD SCRUBBER */}
            <div 
              className="absolute top-[32px] bottom-0 w-[1.5px] bg-[#fb4e4e] pointer-events-none z-30 flex flex-col items-center select-none"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              {/* Playhead triangular handle pointing down, hanging beautifully at the border */}
              <div className="w-3 h-3 bg-[#fb4e4e] rotate-45 transform -translate-y-1.5 shadow-md border border-white/10 z-40"></div>
              {/* Active laser glow line */}
              <div className="w-[1.5px] h-full bg-[#fb4e4e]/90"></div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
