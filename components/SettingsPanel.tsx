"use client";

import { useRef, useState, useEffect } from "react";
import { X, Upload, Trash2, Image, KeyRound, Eye, EyeOff, SlidersHorizontal } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { getCoordinatorsAndGroups } from "@/app/settings/actions";

interface Props {
  onClose: () => void;
}

type Item = { id: string; name: string };

export default function SettingsPanel({ onClose }: Props) {
  const { settings, setLogo, setAirtableToken, toggleCoordinator, toggleGroup } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [tokenInput, setTokenInput] = useState(settings.airtableToken);
  const [showToken, setShowToken] = useState(false);
  const [tab, setTab] = useState<"control" | "logo" | "token">("control");
  const [coordinators, setCoordinators] = useState<Item[]>([]);
  const [groups, setGroups] = useState<Item[]>([]);

  useEffect(() => {
    getCoordinatorsAndGroups().then(({ coordinators, groups }) => {
      setCoordinators(coordinators);
      setGroups(groups);
    });
  }, []);

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

  const tabs = [
    { key: "control" as const, label: "ממשק שליטה" },
    { key: "logo" as const, label: "לוגו" },
    { key: "token" as const, label: "Airtable" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div dir="rtl" className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-[#1e3a5f]">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <SlidersHorizontal size={16} />
            הגדרות מערכת
          </h2>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 text-sm py-2.5 font-medium transition-colors ${
                tab === t.key
                  ? "border-b-2 border-[#1e3a5f] text-[#1e3a5f]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── Control Panel ─────────────────────────────────── */}
          {tab === "control" && (
            <>
              {/* Coordinators */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">משפיעים</h3>
                {coordinators.length === 0 ? (
                  <p className="text-xs text-gray-400">טוען...</p>
                ) : (
                  <div className="space-y-2">
                    {coordinators.map((c) => {
                      const hidden = settings.hiddenCoordinators.includes(c.id);
                      return (
                        <div key={c.id} className="flex items-center justify-between gap-3 py-1">
                          <span className={`text-sm ${hidden ? "text-gray-400 line-through" : "text-gray-800"}`}>
                            {c.name}
                          </span>
                          <button
                            dir="ltr"
                            onClick={() => toggleCoordinator(c.id)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                              hidden ? "bg-red-400" : "bg-green-500"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                hidden ? "translate-x-1" : "translate-x-6"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="border-t border-gray-100" />

              {/* Groups */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">קבוצות</h3>
                {groups.length === 0 ? (
                  <p className="text-xs text-gray-400">טוען...</p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((g) => {
                      const hidden = settings.hiddenGroups.includes(g.id);
                      return (
                        <div key={g.id} className="flex items-center justify-between gap-3 py-1">
                          <span className={`text-sm ${hidden ? "text-gray-400 line-through" : "text-gray-800"}`}>
                            {g.name}
                          </span>
                          <button
                            dir="ltr"
                            onClick={() => toggleGroup(g.id)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                              hidden ? "bg-red-400" : "bg-green-500"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                hidden ? "translate-x-1" : "translate-x-6"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 leading-relaxed">
                  בחורים של משפיע או קבוצה מכובים לא יופיעו בשום מקום במערכת.
                  הבחירה נשמרת אוטומטית.
                </p>
              </div>
            </>
          )}

          {/* ── Airtable token ─────────────────────────────────── */}
          {tab === "token" && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <KeyRound size={15} className="text-[#1e3a5f]" />
                טוקן Airtable (לסנכרון)
              </h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showToken ? "text" : "password"}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="pat..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    dir="ltr"
                  />
                  <button
                    onClick={() => setShowToken((v) => !v)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  onClick={() => setAirtableToken(tokenInput)}
                  className="px-3 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f] transition-colors"
                >
                  שמור
                </button>
              </div>
              {settings.airtableToken && (
                <p className="text-xs text-green-600 mt-1.5">✓ טוקן שמור</p>
              )}
            </section>
          )}

          {/* ── Logo ───────────────────────────────────────────── */}
          {tab === "logo" && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Image size={15} className="text-[#1e3a5f]" />
                לוגו המערכת
              </h3>

              {settings.logoUrl ? (
                <div className="relative mb-3">
                  <div className="flex items-center justify-center bg-[#1e3a5f]/5 rounded-xl p-4 border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings.logoUrl} alt="לוגו" className="max-h-28 max-w-full object-contain rounded" />
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

              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                  dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/40"
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
          )}
        </div>
      </div>
    </>
  );
}
