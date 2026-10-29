"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import EditModal from "@/components/EditModal";
import { addZman } from "./actions";

const NEW_SEASON = "__new_season__";
const NEW_YEAR = "__new__";

export default function AddZmanButton({
  years,
  seasons,
}: {
  years: { id: string; name: string }[];
  seasons: string[];
}) {
  const [open, setOpen] = useState(false);
  const [season, setSeason] = useState(seasons[0] ?? NEW_SEASON);
  const [yearChoice, setYearChoice] = useState(years[0]?.id ?? NEW_YEAR);
  const [newSeason, setNewSeason] = useState("");
  const [newYear, setNewYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isNewSeason = season === NEW_SEASON;
  const seasonName = isNewSeason ? newSeason.trim() : season;
  const isNew = yearChoice === NEW_YEAR;
  const hasYear = isNew ? !!newYear.trim() : !!yearChoice;

  function save() {
    if (!seasonName) {
      setError("יש לבחור שם זמן");
      return;
    }
    if (!hasYear) {
      setError("יש לבחור שנה");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await addZman(seasonName, isNew ? { name: newYear } : { id: yearChoice });
        setOpen(false);
        setNewYear("");
        setNewSeason("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "ההוספה נכשלה");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-[#1e3a5f] text-white hover:bg-[#2d4f7f]"
      >
        <Plus size={16} />
        הוספת זמן
      </button>
      {open && (
        <EditModal title="הוספת זמן" onClose={() => setOpen(false)} onSave={save} isSaving={isPending}>
          <div>
            <label className="block text-xs text-gray-500 mb-1">שם זמן</label>
            <div className="flex gap-2">
              {seasons.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeason(s)}
                  className={`px-4 py-1.5 text-sm rounded-full border ${
                    season === s
                      ? "bg-orange-100 border-orange-400 text-orange-800"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSeason(NEW_SEASON)}
                className={`px-4 py-1.5 text-sm rounded-full border ${
                  isNewSeason
                    ? "bg-orange-100 border-orange-400 text-orange-800"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                + חדש
              </button>
            </div>
            {isNewSeason && (
              <input
                value={newSeason}
                onChange={(e) => setNewSeason(e.target.value)}
                placeholder="שם זמן חדש"
                className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">שנה</label>
            <select
              value={yearChoice}
              onChange={(e) => setYearChoice(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
              <option value={NEW_YEAR}>+ יצירת שנה חדשה</option>
            </select>
            {yearChoice === NEW_YEAR && (
              <input
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder="למשל תשפז"
                className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </EditModal>
      )}
    </>
  );
}
