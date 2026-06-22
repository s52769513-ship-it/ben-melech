"use client";

import { X } from "lucide-react";

interface FieldSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onToggleField: (field: string) => void;
  fields: { id: string; label: string; isChecked: boolean }[];
}

export default function FieldSettingsModal({
  visible,
  onClose,
  onToggleField,
  fields,
}: FieldSettingsModalProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">הגדרות עמודות</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {fields.map((field) => (
            <label
              key={field.id}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <input
                type="checkbox"
                checked={field.isChecked}
                onChange={() => onToggleField(field.id)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">{field.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
