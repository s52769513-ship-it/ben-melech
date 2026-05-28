"use client";

import { X } from "lucide-react";

interface EditModalProps {
  title: string;
  onClose: () => void;
  onSave: () => void;
  isSaving?: boolean;
  children: React.ReactNode;
}

export default function EditModal({ title, onClose, onSave, isSaving, children }: EditModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm rounded-lg bg-[#1e3a5f] text-white hover:bg-[#2d4f7f] disabled:opacity-50"
          >
            {isSaving ? "שומר..." : "שמור"}
          </button>
        </div>
      </div>
    </div>
  );
}
