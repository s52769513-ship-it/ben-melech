"use client";

import { useStreamedValue } from "@/lib/use-streamed-value";

export type ExamStats = { total: number; count: number; participants: number };

const NONE: Record<string, ExamStats> = {};

// Exam cards are ready long before the scores table they summarise, so the two
// derived numbers stream in on their own instead of holding up the list.
export function ExamAverage({
  examId,
  statsPromise,
}: {
  examId: string;
  statsPromise: Promise<Record<string, ExamStats>>;
}) {
  const [stats] = useStreamedValue(statsPromise, NONE);
  const exam = stats[examId];
  if (!exam || exam.count === 0) return null;
  return (
    <span className="bg-blue-50 text-blue-700 font-bold text-sm px-2.5 py-0.5 rounded-full shrink-0 mr-2">
      {(exam.total / exam.count).toFixed(1)}
    </span>
  );
}

export function ExamParticipants({
  examId,
  statsPromise,
}: {
  examId: string;
  statsPromise: Promise<Record<string, ExamStats>>;
}) {
  const [stats, pending] = useStreamedValue(statsPromise, NONE);
  const exam = stats[examId];
  if (!exam) {
    return pending ? (
      <span className="inline-block h-3 w-14 rounded bg-gray-100 animate-pulse" />
    ) : null;
  }
  return <span>{exam.participants} בחורים</span>;
}
