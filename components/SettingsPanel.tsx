"use client";

import { useRef, useState } from "react";
import { X, Upload, Trash2, Image } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

interface Props {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: Props) {
  const { settings, setLogo } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") setLogo(result);
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        dir="rtl"
        className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-[#1e3a5f]">
          <h2 className="text-white font-semibold text-base">הגדרות מערכת</h2>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Logo section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Image size={15} className="text-[#1e3a5f]" />
              לוגו המערכת
            </h3>

            {/* Preview */}
            {settings.logoUrl ? (
              <div className="relative mb-3">
                <div className="flex items-center justify-center bg-[#1e3a5f]/5 rounded-xl p-4 border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.logoUrl}
                    alt="לוגו"
                    className="max-h-28 max-w-full object-contain rounded"
                  />
                </div>
                <button
                  onClick={() => setLogo("")}
                  className="absolute top-2 left-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-full p-1 transition-colors"
                  title="הסר לוגו"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="mb-3 flex items-center justify-center bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                אין לוגו
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                dragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/40"
              }`}
            >
              <Upload size={22} className="mx-auto mb-2 text-blue-400" />
              <p className="text-sm text-gray-600 font-medium">גרור לוגו לכאן</p>
              <p className="text-xs text-gray-400 mt-1">או לחץ לבחירת קובץ</p>
              <p className="text-xs text-gray-300 mt-1">PNG / JPG / WebP</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </section>
        </div>
      </div>
    </>
  );
}
