/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Plus, 
  Video, 
  Folder, 
  Trash2, 
  Image as ImageIcon, 
  Music, 
  Sparkles,
  Search,
  AlertCircle
} from "lucide-react";
import { MediaAsset } from "../types";

interface MediaPoolProps {
  assets: MediaAsset[];
  onAddAsset: (asset: MediaAsset) => void;
  onDeleteAsset: (id: string) => void;
  onInsertToTimeline: (asset: MediaAsset) => void;
  width?: number;
}

export default function MediaPool({ 
  assets, 
  onAddAsset, 
  onDeleteAsset, 
  onInsertToTimeline,
  width
}: MediaPoolProps) {
  const [activeCategory, setActiveCategory] = useState<"video" | "assets">("video");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New file states
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState<"video" | "audio" | "image">("video");
  const [newFileDuration, setNewFileDuration] = useState("5");
  const [uploadError, setUploadError] = useState("");

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      setUploadError("Please provide a valid file name");
      return;
    }

    const extMap = {
      video: "MP4",
      audio: "MP3",
      image: "JPG"
    };

    const thumbnailMap = {
      video: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80",
      audio: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80"
    };

    const newAsset: MediaAsset = {
      id: "asset-" + Date.now(),
      name: newFileName.endsWith("." + extMap[newFileType].toLowerCase()) 
        ? newFileName 
        : `${newFileName}.${extMap[newFileType].toLowerCase()}`,
      type: newFileType,
      duration: parseFloat(newFileDuration) || 5.0,
      size: `${(Math.random() * 8 + 1).toFixed(1)} MB`,
      extension: extMap[newFileType],
      thumbnailUrl: thumbnailMap[newFileType],
      aspectRatio: newFileType !== "audio" ? "16:9" : undefined
    };

    onAddAsset(newAsset);
    setNewFileName("");
    setShowUploadModal(false);
    setUploadError("");
  };

  const selectPredefined = (name: string, type: "video" | "audio" | "image", duration: number, url: string, ext: string, size: string) => {
    const asset: MediaAsset = {
      id: "asset-" + Date.now(),
      name,
      type,
      duration,
      size,
      extension: ext,
      thumbnailUrl: url,
      aspectRatio: type !== "audio" ? "16:9" : undefined
    };
    onAddAsset(asset);
    setShowUploadModal(false);
  };

  return (
    <div 
      className="bg-[#111113] border-r border-[#1d1d21] flex flex-col h-full select-none font-sans overflow-hidden shrink-0"
      style={{ width: width ? `${width}px` : undefined }}
    >
      {/* Title Header with "+ Add Media" button */}
      <div className="p-3.5 border-b border-[#1d1d21] shrink-0">
        <h3 className="text-[#ceced3] text-[13px] font-sans font-medium tracking-wide mb-3 px-1">Media Pool</h3>
        <button 
          id="btn-add-media"
          onClick={() => setShowUploadModal(true)}
          className="w-[110px] bg-[#1b4d8a] hover:bg-[#235da3] active:bg-[#153e70] text-[#e1e9f5] font-sans text-[11px] py-1.5 px-3 rounded-[3px] flex items-center justify-center gap-1 transition-colors cursor-pointer border border-[#2b6fc2]/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Media</span>
        </button>
      </div>

      {/* Main Content Area split into Tree Panel (Left Nav) & Grid area (Right) */}
      <div className="flex flex-1 min-h-0">
        {/* Navigation Sidebar */}
        <div className="w-[85px] border-r border-[#19191c] bg-[#0c0c0d] p-1 flex flex-col gap-1 shrink-0">
          <button 
            id="nav-category-video"
            onClick={() => setActiveCategory("video")}
            className={`w-full py-2.5 px-1 rounded-[3px] flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-all relative ${
              activeCategory === "video" 
                ? "bg-[#17171a] text-[#428cdc]" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-[#111113]/50"
            }`}
          >
            {activeCategory === "video" && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[#428cdc] rounded-r"></span>
            )}
            <Video className="w-4 h-4" />
            <span className="text-[10px] font-medium tracking-tight">Video</span>
          </button>

          <button 
            id="nav-category-assets"
            onClick={() => setActiveCategory("assets")}
            className={`w-full py-2.5 px-1 rounded-[3px] flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-all relative ${
              activeCategory === "assets" 
                ? "bg-[#17171a] text-[#428cdc]" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-[#111113]/50"
            }`}
          >
            {activeCategory === "assets" && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[#428cdc] rounded-r"></span>
            )}
            <Folder className="w-4 h-4" />
            <span className="text-[10px] font-medium tracking-tight">Assets</span>
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 bg-[#111113] p-3 flex flex-col min-w-0 h-full">
          {/* Subheader Title */}
          <div className="text-[11px] font-semibold text-[#8b8b92] mb-2 uppercase tracking-wider shrink-0">
            {activeCategory === "video" ? "Video Clips" : "Assets & Media"}
          </div>

          {/* Elegant Search bar within Media Pool */}
          <div className="relative mb-3 shrink-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <Search className="w-3.5 h-3.5 text-zinc-600" />
            </span>
            <input 
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181c] border border-[#232329] focus:border-[#428cdc]/60 focus:outline-none rounded-[4px] pl-8 pr-2.5 py-1 text-[11px] text-zinc-200 placeholder-zinc-600 font-sans"
            />
          </div>

          {/* Unified dynamic list filtering by category and search term */}
          <div className="flex-1 overflow-y-auto pr-0.5 grid grid-cols-2 gap-x-2.5 gap-y-3.5 content-start pb-4">
            {assets
              .filter(item => {
                // Category Filter
                const categoryMatch = activeCategory === "video" 
                  ? item.type === "video" 
                  : item.type !== "video";
                
                // Search term match
                const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                
                return categoryMatch && nameMatch;
              })
              .map(item => (
                <div 
                  key={item.id}
                  onClick={() => onInsertToTimeline(item)}
                  className="group flex flex-col cursor-pointer relative"
                  title="Click to insert to timeline playhead"
                >
                  <div className="relative aspect-[16/10] bg-black rounded-[4px] overflow-hidden border border-[#1d1d21] group-hover:border-[#428cdc]/60 hover:shadow-lg transition-all flex items-center justify-center">
                    
                    {/* Adaptive renderer (native blob URLs or presets) */}
                    {item.type === "video" ? (
                      item.thumbnailUrl.startsWith("blob:") ? (
                        <video 
                          src={item.thumbnailUrl} 
                          className="w-full h-full object-cover opacity-80 pointer-events-none"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <img 
                          src={item.thumbnailUrl} 
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-80 pointer-events-none"
                        />
                      )
                    ) : item.type === "image" ? (
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-85 pointer-events-none"
                      />
                    ) : (
                      /* Waveform representation for audio clips */
                      <div className="w-full h-full bg-[#141416] flex flex-col items-center justify-center gap-1.5 text-zinc-400 pointer-events-none">
                        <svg className="w-6 h-6 stroke-current stroke-[1.25] text-blue-500/60" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18V5l12-2v13M9 15c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3zm12-2c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3z" />
                        </svg>
                      </div>
                    )}

                    {/* Standard circular play overlay badge for video format clips */}
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-6 h-6 rounded-full border border-white/25 bg-black/45 flex items-center justify-center backdrop-blur-[0.5px]">
                          <svg className="w-2 h-2 text-white fill-current translate-x-[0.5px]" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Hover Trash to easily clean workspace pool items */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAsset(item.id);
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-950/80 rounded-[3px] transition-all opacity-0 group-hover:opacity-100 cursor-pointer border border-[#1d1d21]/35 hover:border-red-900/60 shadow-md"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3 h-3 text-red-400 hover:text-red-300" />
                    </button>
                    
                    {/* Duration badge overlay */}
                    <div className="absolute bottom-1 right-1 bg-black/75 px-1 rounded-[2px] text-[8.5px] font-mono text-zinc-400">
                      {item.duration.toFixed(1)}s
                    </div>
                  </div>
                  
                  {/* Name label */}
                  <span className="text-[10px] text-[#bcbcbf] mt-1.5 text-center truncate font-sans tracking-tight px-1 group-hover:text-white transition-colors">
                    {item.name}
                  </span>
                </div>
              ))}
            
            {assets.filter(item => {
              const categoryMatch = activeCategory === "video" ? item.type === "video" : item.type !== "video";
              const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
              return categoryMatch && nameMatch;
            }).length === 0 && (
              <div className="col-span-2 py-10 text-center flex flex-col items-center justify-center gap-2 text-zinc-650">
                <AlertCircle className="w-5 h-5 text-zinc-600" />
                <span className="text-[11px] font-sans text-zinc-500">No media assets found in this view</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Dialog Modal to Input Custom Upload Files */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-zinc-100 font-sans font-medium text-sm">Import Dynamic Media Assets</span>
              </div>
              <button 
                onClick={() => { setShowUploadModal(false); setUploadError(""); }}
                className="text-zinc-500 hover:text-zinc-300 text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-4">
              {/* Predefined Quick templates to easily match user criteria */}
              <div className="mb-4">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-2">Instant Workspace Assets</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => selectPredefined(
                      "drone_mountain.mp4", "video", 8.2, 
                      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80", "MP4", "22.1 MB"
                    )}
                    className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left rounded text-[11px] text-zinc-300 transition-colors cursor-pointer flex flex-col gap-0.5"
                  >
                    <span className="font-mono font-medium truncate text-blue-400">drone_mountain.mp4</span>
                    <span className="text-[9px] text-zinc-500">8.2s • Video clip</span>
                  </button>

                  <button 
                    onClick={() => selectPredefined(
                      "ocean_waves.mp4", "video", 6.0, 
                      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=400&q=80", "MP4", "11.5 MB"
                    )}
                    className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left rounded text-[11px] text-zinc-300 transition-colors cursor-pointer flex flex-col gap-0.5"
                  >
                    <span className="font-mono font-medium truncate text-blue-400">ocean_waves.mp4</span>
                    <span className="text-[9px] text-zinc-500">6.0s • Video clip</span>
                  </button>
                </div>
              </div>

              <div className="relative flex items-center justify-center my-3 bg-zinc-950 py-1.5 rounded text-[10px] text-zinc-500 font-mono">
                <span className="bg-zinc-900 px-2 relative z-10 font-bold">OR CONFIGURE A NEW CUSTOM FILE</span>
                <span className="absolute left-4 right-4 h-[1px] bg-zinc-800 z-0"></span>
              </div>

              {uploadError && (
                <div className="mb-3 px-3 py-2 bg-red-950/50 border border-red-500/30 rounded text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Form to submit customized files */}
              <form onSubmit={handleCreateAsset} className="space-y-3.5">
                <div>
                  <label className="text-zinc-400 text-[11px] font-semibold mb-1 block">File Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. My_Project_Intro"
                    value={newFileName}
                    onChange={(e) => { setNewFileName(e.target.value); setUploadError(""); }}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded px-3 py-2 text-xs text-zinc-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-[11px] font-semibold mb-1 block">Format Type</label>
                    <select
                       value={newFileType}
                       onChange={(e) => setNewFileType(e.target.value as any)}
                       className="w-full bg-zinc-950 border border-zinc-800 focus:outline-none rounded px-2.5 py-2 text-xs text-zinc-200 cursor-pointer"
                    >
                      <option value="video">Video (MP4)</option>
                      <option value="audio">Audio (MP3)</option>
                      <option value="image">Image / Graphic (JPG/PNG)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[11px] font-semibold mb-1 block">Duration (seconds)</label>
                    <input 
                      type="number"
                      min="1"
                      max="120"
                      value={newFileDuration}
                      onChange={(e) => setNewFileDuration(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:outline-none rounded px-3 py-2 text-xs text-zinc-200"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#1b4d8a] hover:bg-blue-500 text-white font-semibold text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Custom Asset</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
