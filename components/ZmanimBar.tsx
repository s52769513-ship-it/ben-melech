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
  const [data, setData] = useState<ZmanimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch zmanim once on mount
  useEffect(() => {
    async function load() {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10);
      const [y, m, d] = dateStr.split("-");
      const isFriday = today.getDay() === 5;

      try {
        const [zmanimRes, converterRes, learningRes] = await Promise.all([
          fetch(
            `https://www.hebcal.com/zmanim?cfg=json&geonameid=281184&date=${dateStr}`
          ),
          fetch(
            `https://www.hebcal.com/converter?cfg=json&g2h=1&gy=${y}&gm=${m}&gd=${d}`
          ),
          fetch(
            `https://www.hebcal.com/learning?cfg=json&v=1&daf_yomi=on&start=${dateStr}&end=${dateStr}`
          ),
        ]);

        const [zmanimJson, converterJson, learningJson] = await Promise.all([
          zmanimRes.json(),
          converterRes.json(),
          learningRes.json(),
        ]);

        const hebrewDate: string = converterJson.hebrew ?? "";
        const dafItem = (learningJson.items ?? []).find(
          (i: { category: string; hebrew?: string; title?: string }) =>
            i.category === "dafyomi"
        );
        const dafYomi: string = dafItem?.hebrew ?? dafItem?.title ?? "";

        const times: ZmanimTimes = zmanimJson.times ?? {};

        // Candle lighting = sunset - 18 min
        let candleLighting: string | undefined;
        if (isFriday && times.sunset) {
          const sunsetMs = new Date(times.sunset).getTime();
          const candles = new Date(sunsetMs - 18 * 60 * 1000);
          candleLighting = candles.toISOString();
        }

        setData({ hebrewDate, dafYomi, times, isFriday, candleLighting });
      } catch {
        // fail silently — bar won't show zmanim but clock still works
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Countdown target: candle lighting on Friday, otherwise sunset
  const countdownIso = data?.isFriday
    ? data.candleLighting ?? data.times.sunset
    : data?.times.sunset;

  const countdownLabel = data?.isFriday ? "כניסת שבת" : "שקיעה";
  const countdownTarget = countdownIso ? new Date(countdownIso) : null;
  const countdownStr =
    countdownTarget && countdownTarget > now
      ? getCountdown(countdownTarget, now)
      : null;

  const currentTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  return (
    <div
      dir="rtl"
      className="sticky top-0 z-30 bg-[#152d4a] border-b border-[#2d4f7f] text-white text-xs flex items-center gap-0 overflow-x-auto print:hidden"
    >
      {/* Clock */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-l border-[#2d4f7f] shrink-0">
        <Clock size={13} className="text-blue-400" />
        <span className="font-mono font-semibold text-sm tracking-wide">
          {currentTimeStr}
        </span>
      </div>

      {loading ? (
        <span className="px-4 text-blue-400 animate-pulse">טוען זמנים...</span>
      ) : data ? (
        <>
          {/* Hebrew date */}
          {data.hebrewDate && (
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-l border-[#2d4f7f] shrink-0">
              <span className="text-blue-300 font-medium">{data.hebrewDate}</span>
            </div>
          )}

          {/* Daf Yomi */}
          {data.dafYomi && (
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-l border-[#2d4f7f] shrink-0">
              <BookOpen size={12} className="text-blue-400 shrink-0" />
              <span className="text-blue-300">דף יומי:</span>
              <span className="font-medium text-white">{data.dafYomi}</span>
            </div>
          )}

          {/* Zmanim */}
          <div className="flex items-center border-l border-[#2d4f7f]">
            {ZMANIM_LIST.map(({ label, key }) => {
              const val = data.times[key];
              if (!val) return null;
              const isSunset = key === "sunset";
              const isSunrise = key === "sunrise";
              return (
                <div
                  key={key}
                  className="flex items-center gap-1 px-3 py-2.5 border-l border-[#2d4f7f]/60 shrink-0 hover:bg-[#1e3a5f] transition-colors"
                >
                  {(isSunrise || isSunset) && (
                    <Sun size={11} className={isSunset ? "text-orange-400" : "text-yellow-300"} />
                  )}
                  <span className="text-blue-300">{label}</span>
                  <span className="font-medium text-white mr-0.5">{formatTime(val)}</span>
                </div>
              );
            })}

            {/* Candle lighting (Friday) */}
            {data.isFriday && data.candleLighting && (
              <div className="flex items-center gap-1 px-3 py-2.5 border-l border-[#2d4f7f]/60 shrink-0">
                <span className="text-yellow-300">🕯</span>
                <span className="text-yellow-300 font-medium">כניסת שבת</span>
                <span className="font-semibold text-yellow-200 mr-0.5">
                  {formatTime(data.candleLighting)}
                </span>
              </div>
            )}
          </div>

          {/* Countdown */}
          {countdownStr && (
            <div className="flex items-center gap-2 px-4 py-1.5 mr-auto shrink-0">
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 border ${
                  data.isFriday
                    ? "bg-yellow-900/40 border-yellow-600/50 text-yellow-200"
                    : "bg-blue-900/50 border-blue-600/40 text-blue-100"
                }`}
              >
                <span className="text-[11px]">{countdownLabel} בעוד</span>
                <span className="font-mono font-bold text-sm tracking-wider">
                  {countdownStr}
                </span>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
