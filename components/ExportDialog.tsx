"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  city: string | null;
  street: string | null;
  birth_date: string | null;
  id_number: number | null;
  phone: string | null;
  father_name: string | null;
  yeshiva: string | null;
  track: string | null;
  enrollment_date: string | null;
  nedarim_amount: number | null;
  nedarim_charged: number | null;
  remaining_to_load: number | null;
  summer_points: number | null;
  summer_points_over_500: number | null;
  notes: string | null;
  coordinator?: { id: string; name: string } | null;
};

type ScoreStats = { total: number; count: number; attended: number; sessions: number };

const ALL_COLUMNS = [
  { key: "name", label: "שם" },
  { key: "phone", label: "טלפון" },
  { key: "id_number", label: "ת.ז" },
  { key: "city", label: "עיר" },
  { key: "street", label: "רחוב" },
  { key: "birth_date", label: "תאריך לידה" },
  { key: "enrollment_date", label: "תאריך הצטרפות" },
  { key: "father_name", label: "שם האב" },
  { key: "yeshiva", label: "ישיבה" },
  { key: "track", label: "מסלול" },
  { key: "coordinator", label: "משפיע" },
  { key: "attendance", label: "נוכחות" },
  { key: "avg_score", label: "ציון ממוצע" },
  { key: "nedarim_amount", label: "כסף להטענה" },
  { key: "nedarim_charged", label: "הוטען" },
  { key: "remaining_to_load", label: "נשאר להטעין" },
  { key: "summer_points", label: "נקודות זמן קיץ תשפו" },
  { key: "summer_points_over_500", label: 'נקודות זמן קיץ תשפו (מעל 500)' },
  { key: "notes", label: "הערות" },
];

function getValue(student: Student, key: string, scoreMap: Record<string, ScoreStats>): string {
  const stats = scoreMap[student.id];
  switch (key) {
    case "name": return `${student.first_name} ${student.last_name}`;
    case "phone": return student.phone ?? "";
    case "id_number": return student.id_number?.toString() ?? "";
    case "city": return student.city ?? "";
    case "street": return student.street ?? "";
    case "birth_date": return student.birth_date?.slice(0, 10) ?? "";
    case "enrollment_date": return student.enrollment_date?.slice(0, 10) ?? "";
    case "father_name": return student.father_name ?? "";
    case "yeshiva": return student.yeshiva ?? "";
    case "track": return student.track ?? "";
    case "coordinator": return (student.coordinator as { name: string } | null)?.name ?? "";
    case "attendance":
      return stats && stats.sessions > 0
        ? Math.round((stats.attended / stats.sessions) * 100) + "%"
        : "";
    case "avg_score":
      return stats && stats.count > 0
        ? (stats.total / stats.count).toFixed(1)
        : "";
    case "nedarim_amount": return student.nedarim_amount != null ? String(student.nedarim_amount) : "";
    case "nedarim_charged": return student.nedarim_charged != null ? String(student.nedarim_charged) : "";
    case "remaining_to_load": return student.remaining_to_load != null ? String(student.remaining_to_load) : "";
    case "summer_points": return student.summer_points != null ? String(student.summer_points) : "";
    case "summer_points_over_500": return student.summer_points_over_500 != null ? String(student.summer_points_over_500) : "";
    case "notes": return student.notes ?? "";
    default: return "";
  }
}

interface Props {
  students: Student[];
  scoreMap: Record<string, ScoreStats>;
  format: "excel" | "pdf";
  onClose: () => void;
  visibleFields?: string[];
  fieldOrder?: string[];
}

export default function ExportDialog({ students, scoreMap, format, onClose, visibleFields, fieldOrder }: Props) {
  const defaultSelected = visibleFields && visibleFields.length > 0
    ? new Set(visibleFields.filter((f) => ALL_COLUMNS.some((c) => c.key === f)))
    : new Set(["name", "phone", "city", "yeshiva", "track", "coordinator", "attendance", "avg_score"]);

  const [selected, setSelected] = useState<Set<string>>(defaultSelected);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function doExport() {
    let cols = ALL_COLUMNS.filter((c) => selected.has(c.key));

    if (fieldOrder && fieldOrder.length > 0) {
      cols = cols.sort((a, b) => {
        const aIndex = fieldOrder.indexOf(a.key);
        const bIndex = fieldOrder.indexOf(b.key);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
    }

    const headers = cols.map((c) => c.label);
    const rows = students.map((s) => cols.map((c) => getValue(s, c.key, scoreMap)));

    if (format === "excel") {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "בחורים");
      XLSX.writeFile(wb, "בחורים.xlsx");
      onClose();
      return;
    }

    // PDF via browser print (natively supports Hebrew/RTL)
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>בחורים</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; direction: rtl; margin: 20px; }
    h2 { color: #1e3a5f; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #1e3a5f; color: white; padding: 8px 10px; text-align: right; }
    td { border: 1px solid #ddd; padding: 6px 10px; text-align: right; }
    tr:nth-child(even) td { background: #f5f7fa; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h2>רשימת בחורים</h2>
  <table>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-xl shadow-xl w-[460px] max-h-[80vh] flex flex-col"
        dir="rtl"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            בחר עמודות לייצוא {format === "excel" ? "Excel" : "PDF"}
          </h2>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              let cols = [...ALL_COLUMNS];
              if (fieldOrder && fieldOrder.length > 0) {
                cols = cols.sort((a, b) => {
                  const aIndex = fieldOrder.indexOf(a.key);
                  const bIndex = fieldOrder.indexOf(b.key);
                  return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
                });
              }
              return cols.map((col) => (
                <label key={col.key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selected.has(col.key)}
                    onChange={() => toggle(col.key)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{col.label}</span>
                </label>
              ));
            })()}
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3 justify-start">
          <button
            onClick={doExport}
            disabled={selected.size === 0}
            className="text-sm px-5 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4f7f] transition-colors disabled:opacity-40"
          >
            הורד {format === "excel" ? "Excel" : "PDF"}
          </button>
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
