"use client";

import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Download, MousePointer2, Globe } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useState } from "react";

const LOCALES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

export function Toolbar({ onExport }: { onExport?: () => void }) {
  const { undo, redo, canUndo, canRedo, setActiveTool } = useEditorStore();
  const t = useTranslations("toolbar");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const switchLocale = (newLocale: string) => {
    setShowLangMenu(false);
    if (newLocale === locale) return;
    // Replace locale prefix in pathname  e.g. /en/editor/video → /vi/editor/video
    const segments = pathname.split("/");
    segments[1] = newLocale;
    startTransition(() => {
      router.push(segments.join("/"));
    });
  };

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <header className="h-14 border-b border-neutral-800 bg-[#0f0f0f] flex items-center justify-between px-4 shrink-0 relative z-50">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          MediaEditor
        </h1>
        <div className="h-6 w-px bg-neutral-800 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">{t("file")}</Button>
          <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">{t("edit")}</Button>
          <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">{t("view")}</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost" size="icon"
          className="text-neutral-400 hover:text-white"
          title="Select Tool"
          onClick={() => setActiveTool("select")}
        >
          <MousePointer2 className="w-4 h-4" />
        </Button>
        <div className="h-6 w-px bg-neutral-800 mx-1" />
        <Button
          variant="ghost" size="icon"
          className="text-neutral-400 hover:text-white"
          title={t("undo")}
          onClick={undo}
          disabled={!canUndo}
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="text-neutral-400 hover:text-white"
          title={t("redo")}
          onClick={redo}
          disabled={!canRedo}
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        <div className="h-6 w-px bg-neutral-800 mx-1" />

        {/* Language switcher */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-white gap-1.5 px-2"
            onClick={() => setShowLangMenu((v) => !v)}
            title={t("language")}
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">{currentLocale.flag} {currentLocale.code.toUpperCase()}</span>
          </Button>

          {showLangMenu && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 z-50 bg-[#1e1e1e] border border-neutral-700 rounded-lg shadow-2xl overflow-hidden min-w-[140px]">
                {LOCALES.map((l) => (
                  <button
                    key={l.code}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-neutral-800 transition-colors ${
                      l.code === locale ? "text-indigo-400 bg-indigo-500/10" : "text-neutral-300"
                    }`}
                    onClick={() => switchLocale(l.code)}
                  >
                    <span className="text-base">{l.flag}</span>
                    <span>{l.label}</span>
                    {l.code === locale && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-9 px-4 rounded-full font-medium"
          disabled={isPending}
          onClick={onExport}
        >
          <Download className="w-4 h-4" />
          {t("export")}
        </Button>
      </div>
    </header>
  );
}
