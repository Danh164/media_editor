"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { useTranslations } from "next-intl";
import { 
  FileText, 
  FolderOpen, 
  Download, 
  Undo2, 
  Redo2, 
  Trash2, 
  Settings, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  LayoutGrid
} from "lucide-react";

export function MenuBar({ onExport }: { onExport?: () => void }) {
  const t = useTranslations("toolbar");
  const ct = useTranslations("common");
  const { undo, redo, canUndo, canRedo, canvas } = useEditorStore();

  const handleClear = () => {
    if (canvas && window.confirm(ct("reset") + "?")) {
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
    }
  };

  return (
    <div className="hidden sm:flex items-center gap-1">
      {/* File Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white h-8 px-3">
              {t("file")}
            </Button>
          }
        />
        <DropdownMenuContent className="w-56 bg-[#1a1a1a] border-neutral-800 text-neutral-300">
          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white">
            <FileText className="w-4 h-4" /> New Project
            <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white">
            <FolderOpen className="w-4 h-4" /> Open...
            <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-neutral-800" />
          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white" onClick={onExport}>
            <Download className="w-4 h-4" /> {t("export")}
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-neutral-800" />
          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white text-red-400 focus:text-red-300" onClick={handleClear}>
            <Trash2 className="w-4 h-4" /> Clear Canvas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white h-8 px-3">
              {t("edit")}
            </Button>
          }
        />
        <DropdownMenuContent className="w-56 bg-[#1a1a1a] border-neutral-800 text-neutral-300">
          <DropdownMenuItem 
            className="gap-2 focus:bg-white/10 focus:text-white" 
            onClick={undo} 
            disabled={!canUndo}
          >
            <Undo2 className="w-4 h-4" /> {t("undo")}
            <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="gap-2 focus:bg-white/10 focus:text-white" 
            onClick={redo} 
            disabled={!canRedo}
          >
            <Redo2 className="w-4 h-4" /> {t("redo")}
            <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-neutral-800" />
          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white">
            <Settings className="w-4 h-4" /> Canvas Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white h-8 px-3">
              {t("view")}
            </Button>
          }
        />
        <DropdownMenuContent className="w-56 bg-[#1a1a1a] border-neutral-800 text-neutral-300">
          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white">
            <ZoomIn className="w-4 h-4" /> Zoom In
            <DropdownMenuShortcut>⌘+</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white">
            <ZoomOut className="w-4 h-4" /> Zoom Out
            <DropdownMenuShortcut>⌘-</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white">
            <Maximize className="w-4 h-4" /> Fit to Screen
            <DropdownMenuShortcut>⌘0</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-neutral-800" />
          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white">
            <LayoutGrid className="w-4 h-4" /> Show Grid
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
