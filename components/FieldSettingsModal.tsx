"use client";

import { useState } from "react";
import { X, GripVertical } from "lucide-react";

interface FieldSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onToggleField: (field: string) => void;
  onReorderFields: (order: string[]) => void;
  fields: { id: string; label: string; isChecked: boolean }[];
}

export default function FieldSettingsModal({
  visible,
  onClose,
  onToggleField,
  onReorderFields,
  fields,
}: FieldSettingsModalProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  if (!visible) return null;

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return;

    const newOrder = [...fields.map((f) => f.id)];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    onReorderFields(newOrder);
    setDraggedItem(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">הגדרות עמודות</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {fields.map((field) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => handleDragStart(field.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(field.id)}
                className={`flex items-start gap-2 p-3 border rounded-lg transition-all cursor-move ${
                  draggedItem === field.id
                    ? "opacity-50 bg-blue-50 border-blue-300"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <GripVertical size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <label className="flex items-start gap-2 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.isChecked}
                    onChange={() => onToggleField(field.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 mt-0.5"
                  />
                  <span className="text-sm font-medium text-gray-700 break-words">
                    {field.label}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
