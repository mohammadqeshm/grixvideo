/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  Trash2,
  Settings,
  Type
} from "lucide-react";
import { TimelineClip } from "../types";

interface PropertiesPanelProps {
  selectedClip: TimelineClip | null;
  onUpdateClip: (updated: TimelineClip) => void;
  onDeleteClip: (id: string) => void;
  onExport: () => void;
  width?: number;
  onStartChange?: () => void;
}

export default function PropertiesPanel({
  selectedClip,
  onUpdateClip,
  onDeleteClip,
  onExport,
  width,
  onStartChange
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<"standard" | "video" | "effects">("standard");
  const [openSections, setOpenSections] = useState({
    standard: true,
    video: true,
    effects: true,
    collapsible: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (field: keyof TimelineClip, value: any) => {
    if (!selectedClip) return;
    onUpdateClip({
      ...selectedClip,
      [field]: value
    });
  };

  return (
    <div 
      className="bg-[#111113] border-l border-[#1d1d21] flex flex-col h-full select-none font-sans overflow-hidden shrink-0"
      style={{ width: width ? `${width}px` : undefined }}
      onMouseDownCapture={onStartChange}
    >
      
      {/* Panel Header & Brand Export */}
      <div className="p-3.5 border-b border-[#1d1d21] flex flex-col gap-3 shrink-0">
        <h3 className="text-[#ceced3] text-[13px] font-sans font-medium tracking-wide">Properties</h3>
        
        {/* Export Video button exactly like reference */}
        <button 
          id="btn-export-video"
          onClick={onExport}
          className="w-full bg-[#1b4d8a] hover:bg-[#235da3] active:bg-[#153e70] text-[#e1e9f5] font-sans text-[11px] py-1.5 px-3 rounded-[3px] flex items-center justify-center gap-1 transition-colors cursor-pointer border border-[#2b6fc2]/20 font-medium"
        >
          <span>Export Video</span>
        </button>
      </div>

      {/* Tabs Menu in the reference */}
      <div className="flex border-b border-[#1d1d21] shrink-0 bg-[#111113]/40 text-[11px] font-medium text-zinc-500">
        <button 
          id="tab-standard"
          onClick={() => setActiveTab("standard")}
          className={`flex-1 py-2 text-center cursor-pointer border-b transition-colors ${
            activeTab === "standard" 
              ? "text-[#428cdc] border-[#428cdc] bg-[#17171a]" 
              : "border-transparent hover:text-zinc-300 text-[#8d8d95]"
          }`}
        >
          Standard
        </button>
        <button 
          id="tab-video"
          onClick={() => setActiveTab("video")}
          className={`flex-1 py-2 text-center cursor-pointer border-b transition-colors ${
            activeTab === "video" 
              ? "text-[#428cdc] border-[#428cdc] bg-[#17171a]" 
              : "border-transparent hover:text-zinc-300 text-[#8d8d95]"
          }`}
        >
          Video
        </button>
        <button 
          id="tab-effects"
          onClick={() => setActiveTab("effects")}
          className={`flex-1 py-2 text-center cursor-pointer border-b transition-colors ${
            activeTab === "effects" 
              ? "text-[#428cdc] border-[#428cdc] bg-[#17171a]" 
              : "border-transparent hover:text-zinc-300 text-[#8d8d95]"
          }`}
        >
          Effects
        </button>
      </div>

      {/* Collapsible Content Panels */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {selectedClip ? (
          <div className="p-2 mb-2 bg-[#17171a] rounded-[3px] border border-[#1d1d21] flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[9px] uppercase font-mono font-bold text-blue-400 tracking-wider block">
                Selected: {selectedClip.type}
              </span>
              <span className="text-[10px] font-mono text-zinc-300 block truncate">
                {selectedClip.name}
              </span>
            </div>
            <button 
              onClick={() => onDeleteClip(selectedClip.id)}
              className="p-1 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 rounded transition-colors cursor-pointer"
              title="Delete clip"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-zinc-500 font-sans italic text-center p-1 bg-[#151517] rounded border border-[#1d1d21]/40">
            No selection. Click a clip to adjust.
          </div>
        )}

        {/* 1. Standard Section */}
        <div className="border border-[#1d1d21] rounded-[3px] overflow-hidden bg-[#141416]/40">
          <button 
            onClick={() => toggleSection("standard")}
            className="w-full px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1c] border-b border-[#1d1d21] text-[11px] font-medium text-[#bcbcbf] flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              {openSections.standard ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Standard</span>
            </span>
          </button>
          
          {openSections.standard && (
            <div className="p-3 space-y-3 text-zinc-400 text-[10px]">
              {selectedClip ? (
                <>
                  {/* Scale */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span>Scale</span>
                      <span className="text-zinc-200">{selectedClip.scale}%</span>
                    </div>
                    <input 
                      type="range" min="10" max="200" step="1"
                      value={selectedClip.scale}
                      onChange={(e) => handleChange("scale", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                    />
                  </div>

                  {/* Opacity */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span>Opacity</span>
                      <span className="text-zinc-200">{selectedClip.opacity}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="1"
                      value={selectedClip.opacity}
                      onChange={(e) => handleChange("opacity", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                    />
                  </div>

                  {/* Speed */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span>Speed</span>
                      <span className="text-zinc-200">{selectedClip.speed}x</span>
                    </div>
                    <input 
                      type="range" min="0.25" max="3" step="0.25"
                      value={selectedClip.speed}
                      onChange={(e) => handleChange("speed", parseFloat(e.target.value))}
                      className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                    />
                  </div>
                </>
              ) : (
                <div className="text-zinc-600 text-center py-2">Standard settings are inactive</div>
              )}
            </div>
          )}
        </div>

        {/* 2. Video Section */}
        <div className="border border-[#1d1d21] rounded-[3px] overflow-hidden bg-[#141416]/40">
          <button 
            onClick={() => toggleSection("video")}
            className="w-full px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1c] border-b border-[#1d1d21] text-[11px] font-medium text-[#bcbcbf] flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              {openSections.video ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Video</span>
            </span>
          </button>
          
          {openSections.video && (
            <div className="p-3 space-y-3 text-zinc-400 text-[10px]">
              {selectedClip ? (
                <>
                  {/* Contrast */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span>Contrast</span>
                      <span className="text-zinc-200">{selectedClip.contrast}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="150" step="1"
                      value={selectedClip.contrast}
                      onChange={(e) => handleChange("contrast", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                    />
                  </div>

                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span>Brightness</span>
                      <span className="text-zinc-200">{selectedClip.brightness}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="150" step="1"
                      value={selectedClip.brightness}
                      onChange={(e) => handleChange("brightness", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                    />
                  </div>
                </>
              ) : (
                <div className="text-zinc-600 text-center py-2">Video settings are inactive</div>
              )}
            </div>
          )}
        </div>

        {/* 3. Effects Section */}
        <div className="border border-[#1d1d21] rounded-[3px] overflow-hidden bg-[#141416]/40">
          <button 
            onClick={() => toggleSection("effects")}
            className="w-full px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1c] border-b border-[#1d1d21] text-[11px] font-medium text-[#bcbcbf] flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              {openSections.effects ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Effects</span>
            </span>
          </button>
          
          {openSections.effects && (
            <div className="p-3 space-y-3 text-zinc-400 text-[10px]">
              {selectedClip ? (
                <>
                  {/* Saturation */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span>Saturation</span>
                      <span className="text-zinc-200">{selectedClip.saturate}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="200" step="5"
                      value={selectedClip.saturate}
                      onChange={(e) => handleChange("saturate", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                    />
                  </div>

                  {/* Lens Blur */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1 font-mono text-[9px]">
                      <span>Lens Blur</span>
                      <span className="text-zinc-200">{selectedClip.blur} px</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" step="1"
                      value={selectedClip.blur}
                      onChange={(e) => handleChange("blur", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                    />
                  </div>

                  {/* Text properties edit if it is standard Text */}
                  {selectedClip.type === "text" && (
                    <div className="border-t border-[#1d1d21] pt-2 mt-2 space-y-2">
                       <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Text Control</span>
                       <input 
                         type="text"
                         value={selectedClip.textOverlay || ""}
                         onChange={(e) => handleChange("textOverlay", e.target.value)}
                         className="w-full bg-[#0c0c0d] border border-[#1d1d21] rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-[#428cdc]"
                       />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-zinc-600 text-center py-2">Effects settings are inactive</div>
              )}
            </div>
          )}
        </div>

        {/* 4. Collapsible Section exactly as shown in screenshot */}
        <div className="border border-[#1d1d21] rounded-[3px] overflow-hidden bg-[#141416]/40">
          <button 
            onClick={() => toggleSection("collapsible")}
            className="w-full px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1c] border-b border-[#1d1d21] text-[11px] font-medium text-[#bcbcbf] flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              {openSections.collapsible ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Collapsible</span>
            </span>
          </button>
          
          {openSections.collapsible && (
            <div className="p-3 text-zinc-600 text-center text-[10px]">
              No active nested configurations
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
