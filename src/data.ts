/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MediaAsset, TimelineClip, TimelineTrack } from "./types";

export const INITIAL_ASSETS: MediaAsset[] = [
  {
    id: "asset-intro",
    name: "Intro_Scene.mp4",
    type: "video",
    duration: 10.0, // seconds
    size: "14.2 MB",
    extension: "MP4",
    thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    aspectRatio: "16:9"
  },
  {
    id: "asset-sunset",
    name: "Sunset_bg.jpg",
    type: "image",
    duration: 5.0, // static images have an editable duration
    size: "3.1 MB",
    extension: "JPG",
    thumbnailUrl: "https://images.unsplash.com/photo-1472214222541-d510753a4907?auto=format&fit=crop&w=400&q=80",
    aspectRatio: "16:9"
  },
  {
    id: "asset-music",
    name: "Background_Music.mp3",
    type: "audio",
    duration: 120.0,
    size: "4.8 MB",
    extension: "MP3",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
    localBlobUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "asset-overlay",
    name: "Text_Overlay.png",
    type: "image",
    duration: 5.0,
    size: "820 KB",
    extension: "PNG",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80"
  }
];

export const INITIAL_TRACKS: TimelineTrack[] = [
  {
    id: "track-video-1",
    name: "Video Track 1",
    type: "video",
    iconName: "Video"
  },
  {
    id: "track-title-1",
    name: "Title Track",
    type: "title",
    iconName: "Type"
  },
  {
    id: "track-audio-1",
    name: "Audio Track 1",
    type: "audio",
    iconName: "Music"
  }
];

export const INITIAL_CLIPS: TimelineClip[] = [
  {
    id: "clip-intro",
    assetId: "asset-intro",
    trackId: "track-video-1",
    name: "Intro_Scene.mp4",
    type: "video",
    startTime: 0.0, // starts at 0s
    duration: 4.2, // duration of 4.2 seconds
    colorClass: "bg-blue-600/15 border border-blue-500/40 text-blue-300 hover:bg-blue-600/25",
    scale: 100,
    opacity: 100,
    volume: 80,
    speed: 1.0,
    blur: 0,
    contrast: 100,
    brightness: 100,
    hueRotate: 0,
    saturate: 100
  },
  {
    id: "clip-sunset",
    assetId: "asset-sunset",
    trackId: "track-video-1",
    name: "Sunset_bg.jpg",
    type: "image",
    startTime: 5.8, // starts at 5.8s
    duration: 2.2, // duration of 2.2 seconds
    colorClass: "bg-amber-600/20 border border-amber-500/50 hover:bg-amber-600/30",
    scale: 100,
    opacity: 100,
    volume: 100,
    speed: 1.0,
    blur: 0,
    contrast: 110,
    brightness: 100,
    hueRotate: 0,
    saturate: 120
  },
  {
    id: "clip-overlay",
    assetId: "asset-overlay",
    trackId: "track-title-1",
    name: "Text_Overlay.png",
    type: "text",
    startTime: 4.2, // precisely starts at 4.2s (bridging the gap offset)
    duration: 2.0, // duration 2.0 seconds
    colorClass: "bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/30",
    scale: 120,
    opacity: 90,
    volume: 100,
    speed: 1.0,
    blur: 0,
    contrast: 100,
    brightness: 120,
    hueRotate: 0,
    saturate: 100,
    textOverlay: "PEAK VALLEYS",
    textSize: 32,
    textColor: "#ffffff",
    textPositionX: 50,
    textPositionY: 50
  },
  {
    id: "clip-music",
    assetId: "asset-music",
    trackId: "track-audio-1",
    name: "Background_Music.mp3",
    type: "audio",
    startTime: 0.0, // starts at 0s
    duration: 7.5, // duration of 7.5 seconds
    colorClass: "bg-emerald-600/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/25",
    scale: 100,
    opacity: 100,
    volume: 65,
    speed: 1.0,
    blur: 0,
    contrast: 100,
    brightness: 100,
    hueRotate: 0,
    saturate: 100
  }
];
