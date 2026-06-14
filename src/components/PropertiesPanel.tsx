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
    textStyles: true,
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

         {/* Typography & Style Section (Conditional) */}
        {selectedClip && selectedClip.type === "text" && (
          <div className="border border-[#1d1d21] rounded-[3px] overflow-hidden bg-[#141416]/40">
            <button 
              onClick={() => toggleSection("textStyles")}
              className="w-full px-3 py-1.5 bg-[#141416] hover:bg-[#1a1a1c] border-b border-[#1d1d21] text-[11px] font-medium text-[#bcbcbf] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                {openSections.textStyles ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span className="text-[#a46cfc] font-semibold flex items-center gap-1">
                  <Type className="w-3 h-3" />
                  <span>Typography & Style</span>
                </span>
              </span>
            </button>
            
            {openSections.textStyles && (
              <div className="p-3 space-y-3.5 text-zinc-400 text-[10px]">
                {/* 1. Text Overlay */}
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Text Overlay</span>
                  <textarea 
                    value={selectedClip.textOverlay || ""}
                    onChange={(e) => handleChange("textOverlay", e.target.value)}
                    className="w-full bg-[#0c0c0d] border border-[#1d1d21] rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#428cdc] font-sans resize-none"
                    placeholder="Enter subtitle overlay..."
                    rows={2}
                  />
                </div>

                {/* 2. Font Family */}
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span>Font Family</span>
                  </div>
                  <select
                    value={selectedClip.textFontFamily || "Inter"}
                    onChange={(e) => handleChange("textFontFamily", e.target.value)}
                    className="w-full bg-[#0c0c0d] border border-[#1d1d21] rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#428cdc] font-sans cursor-pointer"
                    style={{ fontFamily: selectedClip.textFontFamily || "Inter" }}
                  >
                    <option value="Inter">Inter (Sans)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Mono)</option>
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                    <option value="Pacifico">Pacifico (Script)</option>
                    <option value="Georgia">Georgia (Classic Serif)</option>
                    <option value="Impact">Impact (Heavy Block)</option>
                    <option value="monospace">System Monospace</option>
                  </select>
                </div>

                {/* 3. Text Size */}
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span>Font Size</span>
                    <span className="text-zinc-200 font-mono text-[9px]">{selectedClip.textSize || 24}px</span>
                  </div>
                  <input 
                    type="range" min="10" max="100" step="1"
                    value={selectedClip.textSize || 24}
                    onChange={(e) => handleChange("textSize", parseInt(e.target.value))}
                    className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                  />
                  <div className="flex gap-2 mt-1.5 text-[8.5px] justify-between text-zinc-500 select-none">
                    <button onClick={() => handleChange("textSize", 16)} className="hover:text-zinc-350 transition-colors">Small</button>
                    <button onClick={() => handleChange("textSize", 32)} className="hover:text-zinc-350 transition-colors">Medium</button>
                    <button onClick={() => handleChange("textSize", 54)} className="hover:text-zinc-350 transition-colors">Large</button>
                    <button onClick={() => handleChange("textSize", 80)} className="hover:text-zinc-350 transition-colors">Huge</button>
                  </div>
                </div>

                {/* 4. Text Color */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span>Text Color</span>
                    <div className="flex items-center gap-1.5 bg-[#0c0c0d] border border-[#1d1d21] px-1.5 py-0.5 rounded">
                      <input 
                        type="color"
                        value={selectedClip.textColor?.startsWith("#") ? selectedClip.textColor : "#ffffff"}
                        onChange={(e) => handleChange("textColor", e.target.value)}
                        className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0"
                        title="Custom text color"
                      />
                      <span className="text-[8px] font-mono select-all uppercase">{selectedClip.textColor || "#ffffff"}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {[
                      { name: "White", val: "#ffffff" },
                      { name: "Sunny Yellow", val: "#facc15" },
                      { name: "Sunset Orange", val: "#f97316" },
                      { name: "Peach Red", val: "#f87171" },
                      { name: "Neon Cyan", val: "#22d3ee" },
                      { name: "Retro Purple", val: "#c084fc" },
                      { name: "Active Green", val: "#34d399" },
                      { name: "Dark Charcoal", val: "#111113" }
                    ].map(col => (
                      <button
                        key={col.val}
                        onClick={() => handleChange("textColor", col.val)}
                        className={`w-4 h-4 rounded-full border border-black/50 transition-all ${
                          selectedClip.textColor === col.val ? "scale-125 ring-2 ring-blue-500/80 border-white" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: col.val }}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>

                {/* 5. Text Background Color */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span>Background Color</span>
                    <div className="flex items-center gap-1.5 bg-[#0c0c0d] border border-[#1d1d21] px-1.5 py-0.5 rounded">
                      <select
                        value={selectedClip.textBgColor && selectedClip.textBgColor.startsWith("rgba") ? selectedClip.textBgColor : (selectedClip.textBgColor === "transparent" ? "transparent" : "custom")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "custom") {
                            handleChange("textBgColor", "#000000");
                          } else {
                            handleChange("textBgColor", val);
                          }
                        }}
                        className="bg-transparent border-none text-[9px] text-zinc-300 focus:outline-none cursor-pointer"
                      >
                        <option value="transparent">None</option>
                        <option value="rgba(0, 0, 0, 0.4)">Translucent Dark</option>
                        <option value="rgba(0, 0, 0, 0.85)">Solid Dark</option>
                        <option value="rgba(33, 115, 243, 0.4)">Translucent Blue</option>
                        <option value="rgba(225, 29, 72, 0.4)">Translucent Red</option>
                        <option value="rgba(255, 255, 255, 0.25)">Translucent Light</option>
                        <option value="custom">Solid Custom...</option>
                      </select>
                      
                      {selectedClip.textBgColor && selectedClip.textBgColor !== "transparent" && !selectedClip.textBgColor.startsWith("rgba") && (
                        <input 
                          type="color"
                          value={selectedClip.textBgColor}
                          onChange={(e) => handleChange("textBgColor", e.target.value)}
                          className="w-3.5 h-3.5 bg-transparent border-0 cursor-pointer p-0"
                          title="Custom background color"
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Background Presets */}
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {[
                      { name: "None", val: "transparent" },
                      { name: "Translucent Black", val: "rgba(0, 0, 0, 0.40)" },
                      { name: "Solid Black", val: "#000000" },
                      { name: "Vaporwave Blue", val: "rgba(27, 77, 138, 0.6)" },
                      { name: "Soft Lavender", val: "rgba(147, 51, 234, 0.6)" },
                      { name: "Cinematic Red", val: "rgba(220, 38, 38, 0.6)" }
                    ].map(bgCol => (
                      <button
                        key={bgCol.val}
                        onClick={() => handleChange("textBgColor", bgCol.val)}
                        className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                          selectedClip.textBgColor === bgCol.val ? "scale-125 ring-2 ring-blue-500/85 border-white" : "hover:scale-110"
                        } ${bgCol.val === 'transparent' ? 'bg-[#0c0c0d] border-dashed border-zinc-700/80' : 'border-black/50'}`}
                        style={{ backgroundColor: bgCol.val !== 'transparent' ? bgCol.val : undefined }}
                        title={bgCol.name}
                      >
                        {bgCol.val === 'transparent' && <span className="text-[7px] text-zinc-650 block">/</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Text BG Padding and Border Radius (Conditional) */}
                {selectedClip.textBgColor && selectedClip.textBgColor !== "transparent" && (
                  <div className="border-t border-[#1d1d21]/60 pt-3.5 mt-1 pb-1 space-y-3">
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span>Background Padding</span>
                        <span className="text-zinc-250 font-mono text-[9px]">{selectedClip.textPadding !== undefined ? selectedClip.textPadding : 12}px</span>
                      </div>
                      <input 
                        type="range" min="2" max="32" step="1"
                        value={selectedClip.textPadding !== undefined ? selectedClip.textPadding : 12}
                        onChange={(e) => handleChange("textPadding", parseInt(e.target.value))}
                        className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span>Background Rounding</span>
                        <span className="text-zinc-250 font-mono text-[9px]">{selectedClip.textBorderRadius !== undefined ? selectedClip.textBorderRadius : 6}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="24" step="1"
                        value={selectedClip.textBorderRadius !== undefined ? selectedClip.textBorderRadius : 6}
                        onChange={(e) => handleChange("textBorderRadius", parseInt(e.target.value))}
                        className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* 7. Position Coordinates */}
                <div className="border-t border-[#1d1d21]/60 pt-3.5 mt-1 pb-1 space-y-3">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Screen Position</span>
                  
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex justify-between items-baseline mb-1 text-[9px] text-zinc-500">
                        <span>Horizontal X</span>
                        <span className="text-zinc-300 font-mono text-[9px]">{selectedClip.textPositionX !== undefined ? selectedClip.textPositionX : 50}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="1"
                        value={selectedClip.textPositionX !== undefined ? selectedClip.textPositionX : 50}
                        onChange={(e) => handleChange("textPositionX", parseInt(e.target.value))}
                        className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-baseline mb-1 text-[9px] text-zinc-500">
                        <span>Vertical Y</span>
                        <span className="text-zinc-300 font-mono text-[9px]">{selectedClip.textPositionY !== undefined ? selectedClip.textPositionY : 50}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="1"
                        value={selectedClip.textPositionY !== undefined ? selectedClip.textPositionY : 50}
                        onChange={(e) => handleChange("textPositionY", parseInt(e.target.value))}
                        className="w-full h-1 bg-[#1a1a1c] rounded accent-[#428cdc] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 3x3 Position Grid for swift placing */}
                  <div className="pt-1.5">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-wider block mb-1.5 text-center">Quick Presets</span>
                    <div className="grid grid-cols-3 gap-1 max-w-[140px] mx-auto select-none">
                      {[
                        { label: "↖", x: 15, y: 15, title: "Top-Left" },
                        { label: "↑", x: 50, y: 15, title: "Top-Center" },
                        { label: "↗", x: 85, y: 15, title: "Top-Right" },
                        { label: "←", x: 15, y: 50, title: "Middle-Left" },
                        { label: "⊙", x: 50, y: 50, title: "Exact Center" },
                        { label: "→", x: 85, y: 50, title: "Middle-Right" },
                        { label: "↙", x: 15, y: 85, title: "Bottom-Left" },
                        { label: "↓", x: 50, y: 85, title: "Bottom-Center" },
                        { label: "↘", x: 85, y: 85, title: "Bottom-Right" }
                      ].map((pos, idx) => {
                        const isCurrent = (selectedClip.textPositionX === pos.x) && (selectedClip.textPositionY === pos.y);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              handleChange("textPositionX", pos.x);
                              handleChange("textPositionY", pos.y);
                            }}
                            className={`p-1 text-[9px] rounded font-mono font-bold transition-colors ${
                              isCurrent 
                                ? "bg-blue-600/30 text-blue-400 border border-blue-500/60" 
                                : "bg-[#0c0c0d] text-zinc-500 hover:text-zinc-200 hover:bg-[#18181c]"
                            }`}
                            title={pos.title}
                          >
                            {pos.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
