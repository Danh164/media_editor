"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight mb-4">
          {t("title")}
        </h1>
        <p className="text-neutral-400 text-lg max-w-lg mx-auto">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Link href={`/${locale}/editor/image`} className="group">
          <div className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-8 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 h-full flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ImageIcon className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t("imageEditor.title")}</h2>
            <p className="text-neutral-500 mb-6 flex-1">
              {t("imageEditor.description")}
            </p>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {t("imageEditor.cta")}
            </Button>
          </div>
        </Link>

        <Link href={`/${locale}/editor/video`} className="group">
          <div className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 h-full flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <VideoIcon className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t("videoEditor.title")}</h2>
            <p className="text-neutral-500 mb-6 flex-1">
              {t("videoEditor.description")}
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              {t("videoEditor.cta")}
            </Button>
          </div>
        </Link>
      </div>
    </div>
  );
}
