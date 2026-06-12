/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MediaType = "video" | "audio" | "image";

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  duration: number; // in seconds
  size: string;
  extension: string;
  thumbnailUrl: string;
  aspectRatio?: string;
  localBlobUrl?: string;
}

export type ClipType = "video" | "audio" | "image" | "text";

export interface TimelineClip {
  id: string;
  assetId?: string; // empty if it's a generic text/effect clip
  trackId: string;
  name: string;
  type: ClipType;
  startTime: number; // start time in the global timeline (seconds)
  duration: number; // duration of the clip in the timeline (seconds)
  colorClass: string; // Tailwind class color
  scale: number; // 0 to 200
  opacity: number; // 0 to 100
  volume: number; // 0 to 100
  speed: number; // 0.25 to 4.0
  blur: number; // 0 to 20 px
  contrast: number; // 50 to 150
  brightness: number; // 50 to 150
  hueRotate: number; // 0 to 360 degrees
  saturate: number; // 0 to 200 percent
  textOverlay?: string; // text content if type is text
  textSize?: number;
  textColor?: string;
  textPositionX?: number; // percent
  textPositionY?: number; // percent
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: "video" | "title" | "audio";
  iconName: string; // for lucide icons
}

export interface EditorSettings {
  playbackSpeed: number;
  resolution: "1920x1080" | "1280x720" | "1080x1080" | "3840x2160";
  aspectRatio: "16:9" | "9:16" | "1:1";
  gridSnapping: boolean;
}
