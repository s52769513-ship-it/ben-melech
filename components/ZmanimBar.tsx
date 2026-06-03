"use client";

import { useEffect, useState } from "react";
import { Clock, BookOpen, Sun } from "lucide-react";

type ZmanimTimes = {
  alotHaShachar?: string;
  sunrise?: string;
  sofZmanShma?: string;
  chatzot?: string;
  minchaGedola?: string;
  plagHaMincha?: string;
  sunset?: string;
  tzeis?: string;
};

type ZmanimData = {
  hebrewDate: string;
  dafYomi: string;
  times: ZmanimTimes;
  isFriday: boolean;
  candleLighting?: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getCountdown(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

const ZMANIM_LIST: { label: string; key: keyof ZmanimTimes }[] = [
  { label: "עלות השחר", key: "alotHaShachar" },
  { label: "הנץ החמה", key: "sunrise" },
  { label: 'סוף ק"ש', key: "sofZmanShma" },
  { label: "חצות", key: "chatzot" },
  { label: "מנחה גדולה", key: "minchaGedola" },
  { label: "פלג המנחה", key: "plagHaMincha" },
  { label: "שקיעה", key: "sunset" },
  { label: "צאת הכוכבים", key: "tzeis" },
];

export default function ZmanimBar() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ZmanimData | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  // Prevent hydration mismatch — only render dynamic content after mount
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
  }, []);

  // Live clock
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [mounted]);

  // Fetch zmanim once on mount
  useEffect(() => {
    if (!mounted) return;

    async function load() {
      try {
        const res = await fetch("/api/zmanim");
        if (!res.ok) throw new Error("api error");
        const json = await res.json();
        if (json.error) throw new Error(json.error);

        const times: ZmanimTimes = json.times ?? {};
        let candleLighting: string | undefined;
        if (json.isFriday && times.sunset) {
          candleLighting = new Date(new Date(times.sunset).getTime() - 18 * 60 * 1000).toISOString();
        }

        setData({
          hebrewDate: json.hebrewDate ?? "",
          dafYomi: json.dafYomi ?? "",
          times,
          isFriday: json.isFriday ?? false,
          candleLighting,
        });
      } catch {
        setFetchError(true);
      }
    }

    load();
  }, [mounted]);

  // Don't render anything until client-side (avoids hydration mismatch)
  if (!mounted || !now) return null;

  const currentTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const countdownIso = data?.isFriday ? (data.candleLighting ?? data.times.sunset) : data?.times.sunset;
  const countdownLabel = data?.isFriday ? "כניסת שבת" : "שקיעה";
  const countdownTarget = countdownIso ? new Date(countdownIso) : null;
  const countdownStr = countdownTarget && countdownTarget > now ? getCountdown(countdownTarget, now) : null;

  return (
    <div
      dir="rtl"
      className="sticky top-0 z-30 bg-[#152d4a] border-b border-[#2d4f7f] text-white text-xs flex items-center overflow-x-auto print:hidden shrink-0"
    >
      {/* Clock */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-l border-[#2d4f7f] shrink-0">
        <Clock size={13} className="text-blue-400" />
        <span className="font-mono font-semibold text-sm tracking-wide">{currentTimeStr}</span>
      </div>

      {fetchError ? (
        <span className="px-4 text-blue-500 text-xs">לא ניתן לטעון זמנים</span>
      ) : !data ? (
        <span className="px-4 text-blue-400 animate-pulse">טוען זמנים...</span>
      ) : (
        <>
          {data.hebrewDate && (
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-l border-[#2d4f7f] shrink-0">
              <span className="text-blue-300 font-medium">{data.hebrewDate}</span>
            </div>
          )}

          {data.dafYomi && (
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-l border-[#2d4f7f] shrink-0">
              <BookOpen size={12} className="text-blue-400 shrink-0" />
              <span className="text-blue-300">דף יומי:</span>
              <span className="font-medium text-white mr-1">{data.dafYomi}</span>
            </div>
          )}

          <div className="flex items-center border-l border-[#2d4f7f]">
            {ZMANIM_LIST.map(({ label, key }) => {
              const val = data.times[key];
              if (!val) return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-1 px-3 py-2.5 border-l border-[#2d4f7f]/50 shrink-0"
                >
                  {key === "sunrise" && <Sun size={11} className="text-yellow-300" />}
                  {key === "sunset" && <Sun size={11} className="text-orange-400" />}
                  <span className="text-blue-300">{label}</span>
                  <span className="font-medium text-white mr-0.5">{formatTime(val)}</span>
                </div>
              );
            })}

            {data.isFriday && data.candleLighting && (
              <div className="flex items-center gap-1 px-3 py-2.5 border-l border-[#2d4f7f]/50 shrink-0">
                <span>🕯</span>
                <span className="text-yellow-300 font-medium">כניסת שבת</span>
                <span className="font-semibold text-yellow-200 mr-0.5">{formatTime(data.candleLighting)}</span>
              </div>
            )}
          </div>

          {countdownStr && (
            <div className="flex items-center gap-2 px-4 mr-auto shrink-0">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 border ${
                data.isFriday
                  ? "bg-yellow-900/40 border-yellow-600/50 text-yellow-200"
                  : "bg-blue-900/50 border-blue-600/40 text-blue-100"
              }`}>
                <span className="text-[11px]">{countdownLabel} בעוד</span>
                <span className="font-mono font-bold text-sm tracking-wider">{countdownStr}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
