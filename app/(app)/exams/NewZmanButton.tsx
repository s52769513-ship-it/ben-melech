"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";
import EditModal from "@/components/EditModal";
import type { ZmanFormField } from "@/lib/types";
import { createZmanAction, zmanFormFieldsAction } from "./actions";

// The zmanim table computes its name column, so the form is whatever the table
// says can be filled in — read once, when the dialog opens.
export default function NewZmanButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<ZmanFormField[] | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startPending] = useTransition();

  function openDialog() {
    setError(null);
    setValues({});
    setFields(null);
    setOpen(true);
    startPending(async () => {
      try {
        setFields(await zmanFormFieldsAction());
      } catch {
        setError("לא ניתן לקרוא את שדות טבלת הזמנים");
        setFields([]);
      }
    });
  }

  function save() {
    setError(null);
    startPending(async () => {
      const result = await createZmanAction(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (result.id) router.push(`/exams?zman=${result.id}`);
    });
  }

  function set(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400";

  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f] transition-colors"
      >
        <CalendarPlus size={16} />
        זמן חדש
      </button>

      {open && (
        <EditModal
          title="זמן חדש"
          onClose={() => !pending && setOpen(false)}
          onSave={save}
          isSaving={pending}
        >
          {fields === null ? (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              טוען שדות…
            </p>
          ) : fields.length === 0 ? (
            <p className="text-sm text-gray-500">
              אין בטבלת הזמנים שדה שניתן למלא — כל השדות מחושבים באיירטייבל.
            </p>
          ) : (
            fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm text-gray-600 mb-1">{field.name}</label>
                {field.kind === "select" ? (
                  <select
                    value={(values[field.name] as string) ?? ""}
                    onChange={(e) => set(field.name, e.target.value)}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {(field.choices ?? []).map((choice) => (
                      <option key={choice} value={choice}>
                        {choice}
                      </option>
                    ))}
                  </select>
                ) : field.kind === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={values[field.name] === true}
                    onChange={(e) => set(field.name, e.target.checked)}
                    className="w-4 h-4"
                  />
                ) : (
                  <input
                    type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
                    value={(values[field.name] as string) ?? ""}
                    onChange={(e) => set(field.name, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") save();
                    }}
                    className={inputClass}
                  />
                )}
              </div>
            ))
          )}

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
