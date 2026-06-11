"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

type Exam = { id: string; parasha: string; exam_date: string | null };

type Score = {
  student_id: string;
  exam_id: string;
  attended_seder: boolean;
  attended_seder_old: boolean;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    group_id: string | null;
    coordinator: { id: string; name: string } | null;
  } | null;
};

export default function OverviewClient({
  exams,
  scores,
}: {
  exams: Exam[];
  scores: Score[];
}) {
  const [nameSearch, setNameSearch] = useState("");
  const [coordinatorFilter, setCoordinatorFilter] = useState("");
  const { settings, isStudentVisible } = useSettings();

  // Exams ordered oldest→newest; displayed newest→right (RTL: columns flow left, name is rightmost)
  const orderedExams = exams; // already ascending from server

  // Build lookup: studentId → examId → attended_seder
  const attendanceMap = useMemo(() => {
    const map = new Map<string, Map<string, boolean>>();
    scores.forEach((s) => {
      if (!s.student_id) return;
      if (!map.has(s.student_id)) map.set(s.student_id, new Map());
      map.get(s.student_id)!.set(s.exam_id, s.attended_seder || s.attended_seder_old);
    });
    return map;
  }, [scores]);

  // Collect unique students from scores
  const students = useMemo(() => {
    const seen = new Map<string, Score["student"]>();
    scores.forEach((s) => {
      if (s.student && !seen.has(s.student_id)) {
        seen.set(s.student_id, s.student);
      }
    });
    return Array.from(seen.values()).filter(Boolean) as NonNullable<Score["student"]>[];
  }, [scores]);

  // Unique coordinators for filter — excluding hidden ones
  const coordinators = useMemo(() => {
    const names = new Set<string>();
    students.forEach((s) => {
      if (s.coordinator?.name && !settings.hiddenCoordinators.includes(s.coordinator.id)) {
        names.add(s.coordinator.name);
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, "he"));
  }, [students, settings.hiddenCoordinators]);

  // Filtered + grouped by coordinator
  const grouped = useMemo(() => {
    const filtered = students.filter((s) => {
      const fullName = `${s.first_name} ${s.last_name}`;
      if (nameSearch && !fullName.includes(nameSearch)) return false;
      if (coordinatorFilter && s.coordinator?.name !== coordinatorFilter) return false;
      if (!isStudentVisible({ coordinator_id: s.coordinator?.id, group_id: s.group_id })) return false;
      return true;
    });

    const map = new Map<string, { coordName: string; students: typeof filtered }>();
    filtered.forEach((s) => {
      const key = s.coordinator?.id ?? "__none__";
      const coordName = s.coordinator?.name ?? "ללא משפיע";
      if (!map.has(key)) map.set(key, { coordName, students: [] });
      map.get(key)!.students.push(s);
    });

    return Array.from(map.values())
      .sort((a, b) => a.coordName.localeCompare(b.coordName, "he"))
      .map((g) => ({
        ...g,
        students: g.students.sort((a, b) =>
          `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, "he")
        ),
      }));
  }, [students, nameSearch, coordinatorFilter, isStudentVisible, settings.hiddenCoordinators, settings.hiddenGroups]);

  const totalStudents = grouped.reduce((sum, g) => sum + g.students.length, 0);

  return (
    <div dir="rtl">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">משפיע</label>
          <select
            value={coordinatorFilter}
            onChange={(e) => setCoordinatorFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">הכל</option>
            {coordinators.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Search size={11} /> חיפוש שם
          </label>
          <input
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="הקלד שם..."
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-36"
          />
        </div>

        <div className="mr-auto text-sm text-gray-500 self-end pb-2">
          {totalStudents} בחורים | {grouped.length} משפיעים | {orderedExams.length} פרשות
        </div>
      </div>

      {/* Pivot table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#1e3a5f]/5 to-blue-50 border-b-2 border-[#1e3a5f]/20">
                {/* Name column header — rightmost in RTL */}
                <th className="text-right px-5 py-3 font-semibold text-[#1e3a5f] sticky right-0 bg-gradient-to-r from-[#1e3a5f]/5 to-blue-50 z-10 whitespace-nowrap border-l border-gray-200">
                  שם בחור
                </th>
                {/* Parasha columns — newest is leftmost in LTR DOM = rightmost visually next to name in RTL */}
                {[...orderedExams].reverse().map((exam) => (
                  <th
                    key={exam.id}
                    className="px-3 py-3 font-semibold text-[#1e3a5f] text-center whitespace-nowrap min-w-[90px]"
                    title={exam.exam_date ? new Date(exam.exam_date).toLocaleDateString("he-IL") : ""}
                  >
                    <div className="text-xs leading-tight">{exam.parasha}</div>
                    {exam.exam_date && (
                      <div className="text-[10px] font-normal text-gray-400 mt-0.5">
                        {new Date(exam.exam_date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.length === 0 ? (
                <tr>
                  <td
                    colSpan={orderedExams.length + 1}
                    className="px-6 py-16 text-center text-gray-400"
                  >
                    אין רשומות להצגה
                  </td>
                </tr>
              ) : (
                grouped.map(({ coordName, students: groupStudents }) => (
                  <>
                    {/* Coordinator group header */}
                    <tr key={`hdr-${coordName}`} className="bg-blue-50 border-y border-blue-100">
                      <td
                        colSpan={orderedExams.length + 1}
                        className="px-5 py-2 text-sm font-semibold text-[#1e3a5f]"
                      >
                        {coordName}
                        <span className="font-normal text-gray-500 mr-2">
                          ({groupStudents.length} בחורים)
                        </span>
                      </td>
                    </tr>

                    {/* Student rows */}
                    {groupStudents.map((student, idx) => {
                      const examMap = attendanceMap.get(student.id);
                      const totalAttended = orderedExams.filter(
                        (e) => examMap?.get(e.id) === true
                      ).length;
                      const totalExams = orderedExams.filter((e) =>
                        examMap?.has(e.id)
                      ).length;

                      return (
                        <tr
                          key={student.id}
                          className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${
                            idx % 2 === 1 ? "bg-gray-50/40" : ""
                          }`}
                        >
                          {/* Name cell — sticky right */}
                          <td className="px-5 py-2.5 font-medium text-gray-900 whitespace-nowrap sticky right-0 bg-inherit z-10 border-l border-gray-200">
                            <div className="flex items-center gap-2">
                              <span>{`${student.first_name} ${student.last_name}`}</span>
                              {totalExams > 0 && (
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                    totalAttended / totalExams >= 0.8
                                      ? "bg-green-100 text-green-700"
                                      : totalAttended / totalExams >= 0.5
                                      ? "bg-yellow-50 text-yellow-700"
                                      : "bg-red-50 text-red-500"
                                  }`}
                                >
                                  {totalAttended}/{totalExams}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Parasha cells — newest first */}
                          {[...orderedExams].reverse().map((exam) => {
                            const attended = examMap?.get(exam.id);
                            return (
                              <td key={exam.id} className="px-3 py-2.5 text-center">
                                {attended === true ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-600 font-bold text-base">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-7 h-7 text-gray-200 text-base">
                                    —
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex gap-4 flex-wrap">
          <span>סה"כ: {totalStudents} בחורים</span>
          <span>{grouped.length} משפיעים</span>
          <span className="flex items-center gap-1.5 mr-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-bold">✓</span>
            השתתף בסדר
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-300 text-xs mr-1">✗</span>
            לא השתתף
            <span className="text-gray-300 mr-1">—</span>
            אין נתון
          </span>
        </div>
      </div>
    </div>
  );
}
