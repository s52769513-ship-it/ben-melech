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

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [mounted]);

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

  if (!mounted || !now) return null;

  const currentTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const countdownIso = data?.isFriday ? (data.candleLighting ?? data.times.sunset) : data?.times.sunset;
  const countdownLabel = data?.isFriday ? "כניסת שבת" : "שקיעה";
  const countdownTarget = countdownIso ? new Date(countdownIso) : null;
  const countdownStr = countdownTarget && countdownTarget > now ? getCountdown(countdownTarget, now) : null;

  const tickerContent = !data ? null : (
    <>
      {data.hebrewDate && (
        <span className="flex items-center gap-1.5 px-4 shrink-0">
          <span className="text-blue-300 font-medium">{data.hebrewDate}</span>
        </span>
      )}

      {data.dafYomi && (
        <span className="flex items-center gap-1.5 px-4 border-r border-[#2d4f7f]/60 shrink-0">
          <BookOpen size={12} className="text-blue-400 shrink-0" />
          <span className="text-blue-300">דף יומי:</span>
          <span className="font-medium text-white mr-1">{data.dafYomi}</span>
        </span>
      )}

      {ZMANIM_LIST.map(({ label, key }) => {
        const val = data.times[key];
        if (!val) return null;
        return (
          <span
            key={key}
            className="flex items-center gap-1 px-3 border-r border-[#2d4f7f]/50 shrink-0"
          >
            {key === "sunrise" && <Sun size={11} className="text-yellow-300" />}
            {key === "sunset" && <Sun size={11} className="text-orange-400" />}
            <span className="text-blue-300">{label}</span>
            <span className="font-medium text-white mr-0.5">{formatTime(val)}</span>
          </span>
        );
      })}

      {data.isFriday && data.candleLighting && (
        <span className="flex items-center gap-1 px-3 border-r border-[#2d4f7f]/50 shrink-0">
          <span>🕯</span>
          <span className="text-yellow-300 font-medium">כניסת שבת</span>
          <span className="font-semibold text-yellow-200 mr-0.5">{formatTime(data.candleLighting)}</span>
        </span>
      )}

      {/* spacer between repeats */}
      <span className="px-8 shrink-0 text-[#2d4f7f]">◆</span>

  return (
    <>
      <style>{`
        @keyframes zmanimScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .zmanim-ticker {
          animation: zmanimScroll 60s linear infinite;
          display: flex;
          width: max-content;
        }
        .zmanim-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        dir="ltr"
        className="sticky top-0 z-30 bg-[#152d4a] border-b border-[#2d4f7f] text-white text-xs flex items-center print:hidden shrink-0 h-10 overflow-hidden"
      >
        {/* Fixed clock */}
        <div className="flex items-center gap-1.5 px-4 border-r border-[#2d4f7f] shrink-0 h-full">
          <Clock size={13} className="text-blue-400" />
          <span className="font-mono font-semibold text-sm tracking-wide">{currentTimeStr}</span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden h-full flex items-center min-w-0">
          {fetchError ? (
            <span className="px-4 text-blue-500">לא ניתן לטעון זמנים</span>
          ) : !data ? (
            <span className="px-4 text-blue-400 animate-pulse">טוען זמנים...</span>
          ) : (
            <div className="zmanim-ticker" style={{ alignItems: "center" }}>
              <span className="flex items-center h-full" dir="rtl">{tickerContent}</span>
              <span className="flex items-center h-full" dir="rtl">{tickerContent}</span>
            </div>
          )}
        </div>

        {/* Fixed countdown — outside ticker */}
        {countdownStr && data && (
          <div className={`flex items-center gap-2 px-3 shrink-0 border-l border-[#2d4f7f] h-full ${
            data.isFriday ? "text-yellow-200" : "text-blue-100"
          }`}>
            <span className="text-[11px]">{countdownLabel} בעוד</span>
            <span className={`font-mono font-bold text-sm tracking-wider ${data.isFriday ? "text-yellow-300" : "text-white"}`}>
              {countdownStr}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
