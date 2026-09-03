"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, Sun, Snowflake } from "lucide-react";
import EditModal from "@/components/EditModal";
import { createZmanAction } from "./actions";

const SEASONS = [
  { value: "חורף", icon: Snowflake, className: "text-blue-500" },
  { value: "קיץ", icon: Sun, className: "text-orange-500" },
] as const;

export default function NewZmanButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [season, setSeason] = useState<string>("חורף");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function save() {
    setError(null);
    startSaving(async () => {
      const result = await createZmanAction(name, season);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setName("");
      if (result.id) router.push(`/exams?zman=${result.id}`);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f] transition-colors"
      >
        <CalendarPlus size={16} />
        זמן חדש
      </button>

      {open && (
        <EditModal
          title="זמן חדש"
          onClose={() => !saving && setOpen(false)}
          onSave={save}
          isSaving={saving}
        >
          <div>
            <label className="block text-sm text-gray-600 mb-1">שם הזמן</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
              placeholder="לדוגמה: חורף תשפ״ז"
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">עונה</label>
            <div className="flex gap-2">
              {SEASONS.map(({ value, icon: Icon, className }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSeason(value)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors ${
                    season === value
                      ? "border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={14} className={className} />
                  {value}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            מרגע היצירה, כל פרשה חדשה תשויך אוטומטית לזמן הזה. אפשר לשנות שיוך של פרשה בתוך
            דף הפרשה.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </EditModal>
      )}
    </>
  );
}
