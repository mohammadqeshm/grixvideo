/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Undo2, Redo2 } from "lucide-react";

interface HeaderProps {
  onShowSettings: () => void;
  onShowTutorial: () => void;
  activeAssetCount: number;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function Header({ 
  onShowSettings, 
  onShowTutorial, 
  activeAssetCount,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}: HeaderProps) {
  return (
    <header className="h-[38px] bg-[#0c0c0d] border-b border-[#1d1d21] px-3.5 flex items-center justify-between select-none shrink-0 font-sans">
      {/* Brand & Left Side Windows Info */}
      <div className="flex items-center gap-2">
        {/* Custom Blue 'V' Brand Logo */}
        <div className="w-5 h-5 bg-[#1b4d8a] rounded flex items-center justify-center shadow-inner">
          <span className="font-display font-black text-[13px] text-white tracking-widest translate-y-[-0.5px]">V</span>
        </div>
        
        {/* Title corresponding to exact screenshot header */}
        <span className="font-sans text-[11px] text-[#ceced3] tracking-wide font-medium">
          Vertex Video Editor v1.0
        </span>

        {/* Undo/Redo Actions exactly in the header space */}
        <div className="flex items-center gap-1.5 ml-4 border-l border-zinc-850 pl-3">
          <button
            id="btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1 rounded transition-all duration-150 flex items-center justify-center ${
              canUndo 
                ? "text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer" 
                : "text-zinc-600 opacity-40 cursor-not-allowed"
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-redo"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1 rounded transition-all duration-150 flex items-center justify-center ${
              canRedo 
                ? "text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer" 
                : "text-zinc-600 opacity-40 cursor-not-allowed"
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hidden layout action hooks for developer and user configuration but hidden from reference layout block */}
      <div className="flex items-center gap-3">
        {/* Toggle standard tutorial & setting triggers secretly in small elegant visual tags or keep them clean */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onShowTutorial}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors cursor-pointer"
          >
            Quick Guide
          </button>
          <span className="text-zinc-800 text-[9px]">•</span>
          <button 
            onClick={onShowSettings}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors cursor-pointer"
          >
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}
