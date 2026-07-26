"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

// Data now streams in after the shell, so a failed Airtable call should land
// here as a retryable message instead of taking the whole screen down.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8">
      <div className="bg-white rounded-xl border border-gray-200 p-10 max-w-lg mx-auto text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-[#1e3a5f] mb-1">שגיאה בטעינת הנתונים</h2>
        <p className="text-sm text-gray-500 mb-6">
          לא הצלחנו למשוך את הנתונים מאיירטייבל. אפשר לנסות שוב.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#2d4f7f] transition-colors"
        >
          <RotateCw size={15} />
          נסה שוב
        </button>
      </div>
    </div>
  );
}
