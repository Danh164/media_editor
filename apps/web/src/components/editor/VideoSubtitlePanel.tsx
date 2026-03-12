"use client";

import { useState } from "react";
import { Plus, Trash2, Clock, Type, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVideoStore, Subtitle } from "@/stores/videoStore";
import { useVideoEditor } from "@/hooks/useVideoEditor";

export function VideoSubtitlePanel({ onApplySubtitles }: { onApplySubtitles: () => void }) {
  const { 
    subtitles, setSubtitles, currentTime, videoDuration,
    subtitleFontSize, setSubtitleFontSize,
    subtitleColor, setSubtitleColor,
    subtitleBgColor, setSubtitleBgColor,
    subtitlePosition, setSubtitlePosition
  } = useVideoStore();
  const { generateAISubtitles } = useVideoEditor();
  const [newText, setNewText] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleAiGen = async () => {
    setIsAiGenerating(true);
    await generateAISubtitles();
    setIsAiGenerating(false);
  };

  const addSubtitle = () => {
    if (!newText.trim()) return;
    
    const newSub: Subtitle = {
      id: crypto.randomUUID(),
      text: newText,
      start: currentTime,
      end: Math.min(currentTime + 3, videoDuration),
    };

    setSubtitles((prev) => [...prev, newSub].sort((a, b) => a.start - b.start));
    setNewText("");
  };

  const removeSubtitle = (id: string) => {
    setSubtitles((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSubtitle = (id: string, updates: Partial<Subtitle>) => {
    setSubtitles((prev) => 
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
          .sort((a, b) => a.start - b.start)
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      <div className="p-4 border-b border-neutral-800">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Type className="w-4 h-4 text-indigo-400" />
          Subtitles
        </h3>
        <p className="text-[11px] text-neutral-500 mt-1">
          Add timed text to your video.
        </p>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleAiGen}
          disabled={isAiGenerating}
          className="w-full mt-4 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 gap-2 h-9 text-xs font-bold"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-pulse' : ''}`} />
          {isAiGenerating ? "Generating..." : "AI Generate Subtitles"}
        </Button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        {/* Add New Subtitle Form */}
        <div className="space-y-2">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Type your subtitle here..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px] resize-none"
          />
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>Current: {Math.floor(currentTime)}s</span>
            <Button 
              size="sm" 
              onClick={addSubtitle}
              disabled={!newText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-8"
            >
              <Plus className="w-4 h-4 mr-1" /> Add at current time
            </Button>
          </div>
        </div>

        <div className="h-px bg-neutral-800" />
        
        {/* Styling Controls */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Styling & Appearance</h4>
          
          <div className="bg-neutral-900/40 rounded-xl p-3 border border-neutral-800/50 space-y-4">
            {/* Position Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-neutral-500 font-medium ml-1">Position</label>
              <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg">
                {(['top', 'middle', 'bottom'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setSubtitlePosition(pos)}
                    className={`text-[9px] py-1.5 rounded-md transition-all capitalize font-bold tracking-tight ${
                      subtitlePosition === pos 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-neutral-800/80 my-1" />

            {/* Appearance */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-500 font-medium">Text Color</label>
                  <div className="flex gap-2 items-center bg-black/20 p-1.5 rounded-lg border border-neutral-800/50">
                    <input 
                      type="color" 
                      value={subtitleColor} 
                      onChange={(e) => setSubtitleColor(e.target.value)}
                      className="w-6 h-6 rounded-md bg-transparent border-none cursor-pointer p-0"
                    />
                    <span className="text-[10px] text-neutral-400 font-mono tracking-tighter uppercase">{subtitleColor}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-500 font-medium">Background</label>
                  <div className="flex gap-2 items-center bg-black/20 p-1.5 rounded-lg border border-neutral-800/50">
                    <input 
                      type="color" 
                      value={subtitleBgColor === 'transparent' ? '#000000' : subtitleBgColor} 
                      onChange={(e) => setSubtitleBgColor(e.target.value)}
                      className="w-6 h-6 rounded-md bg-transparent border-none cursor-pointer p-0 grayscale-[0.5] opacity-80"
                    />
                     <button 
                      onClick={() => setSubtitleBgColor('transparent')}
                      className={`text-[9px] px-1.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors ${
                        subtitleBgColor === 'transparent' ? 'text-indigo-400' : 'text-neutral-500'
                      }`}
                    >
                      None
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-neutral-500 font-medium">Font Size</label>
                  <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">{subtitleFontSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="12" 
                  max="72" 
                  value={subtitleFontSize} 
                  onChange={(e) => setSubtitleFontSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-neutral-800" />

        {/* List of Subtitles */}
        <div className="space-y-3">
          {subtitles.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-neutral-600 italic">No subtitles added yet.</p>
            </div>
          ) : (
            subtitles.map((sub) => (
              <div 
                key={sub.id} 
                className="group bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-400">
                    <Clock className="w-3 h-3" />
                    <span>{sub.start.toFixed(1)}s - {sub.end.toFixed(1)}s</span>
                  </div>
                  <button 
                    onClick={() => removeSubtitle(sub.id)}
                    className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <input
                  value={sub.text}
                  onChange={(e) => updateSubtitle(sub.id, { text: e.target.value })}
                  className="w-full bg-transparent text-sm text-neutral-200 border-none p-0 focus:ring-0 placeholder:text-neutral-700 mb-2"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-neutral-600 font-bold tracking-wider">Start</label>
                    <input
                      type="number"
                      step="0.1"
                      value={sub.start}
                      onChange={(e) => updateSubtitle(sub.id, { start: Number(e.target.value) })}
                      className="w-full bg-black/30 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-neutral-600 font-bold tracking-wider">End</label>
                    <input
                      type="number"
                      step="0.1"
                      value={sub.end}
                      onChange={(e) => updateSubtitle(sub.id, { end: Number(e.target.value) })}
                      className="w-full bg-black/30 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-400"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 bg-neutral-900/50 border-t border-neutral-800">
        <Button 
          onClick={onApplySubtitles}
          disabled={subtitles.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 py-5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20"
        >
          <Save className="w-4 h-4" />
          Burn Subtitles to Video
        </Button>
        <p className="text-[10px] text-neutral-500 text-center mt-3 leading-relaxed">
          Rendering subtitles will re-encode the video. <br/> This may take a few moments.
        </p>
      </div>
    </div>
  );
}
