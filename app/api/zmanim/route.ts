import { NextResponse } from "next/server";
import { HDate, GeoLocation, Zmanim, HebrewCalendar } from "@hebcal/core";
import { DafYomi } from "@hebcal/learning";

const GLOC = new GeoLocation("Jerusalem", 31.7683, 35.2137, 800, "Asia/Jerusalem");

function toISO(d: Date | null | undefined): string | undefined {
  return d ? d.toISOString() : undefined;
}

export async function GET() {
  const today = new Date();
  const z = new Zmanim(GLOC, today, false);
  const hd = new HDate(today);

  const hebrewDate = hd.renderGematriya();

  const gregorianDate = today.toLocaleDateString("he-IL", {
    day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Jerusalem",
  });

  let dafYomi = "";
  try { dafYomi = new DafYomi(today).render("he"); } catch { dafYomi = ""; }

  // Parasha — next Shabbat within 7 days
  let parasha = "";
  try {
    for (let i = 0; i <= 7; i++) {
      const candidate = new HDate(hd.abs() + i);
      if (candidate.getDay() === 6) {
        const events = HebrewCalendar.calendar({ start: candidate, end: candidate, il: true, sedrot: true, noHolidays: true });
        const pe = events.find(e => e.constructor.name === "ParshaEvent");
        if (pe) parasha = pe.render("he");
        break;
      }
    }
  } catch { parasha = ""; }

  // Holiday / Rosh Chodesh today
  let holiday = "";
  try {
    const events = HebrewCalendar.calendar({ start: hd, end: hd, il: true, noHolidays: false, sedrot: false });
    holiday = events.filter(e => e.constructor.name !== "ParshaEvent").map(e => e.render("he")).filter(Boolean).join(" | ");
  } catch { holiday = ""; }

  const times = {
    alotHaShachar: toISO(z.alotHaShachar()),
    sunrise:       toISO(z.sunrise()),
    sofZmanShma:   toISO(z.sofZmanShma()),
    chatzot:       toISO(z.chatzot()),
    minchaGedola:  toISO(z.minchaGedola()),
    plagHaMincha:  toISO(z.plagHaMincha()),
    sunset:        toISO(z.sunset()),
    tzeis:         toISO(z.tzeit()),
  };

  const dayOfWeek = today.getDay();
  const showShabbat = dayOfWeek >= 3 && dayOfWeek <= 5; // Wed=3, Thu=4, Fri=5

  let candleLightingTime: string | undefined;
  if (showShabbat) {
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7; // 0 on Friday
    const friday = new Date(today);
    friday.setDate(friday.getDate() + daysUntilFriday);
    const zFri = new Zmanim(GLOC, friday, false);
    const fridaySunset = zFri.sunset();
    if (fridaySunset) {
      candleLightingTime = new Date(fridaySunset.getTime() - 18 * 60 * 1000).toISOString();
    }
  }

  return NextResponse.json({
    hebrewDate,
    gregorianDate,
    dafYomi,
    parasha,
    holiday,
    times,
    isFriday: dayOfWeek === 5,
    showShabbat,
    candleLightingTime,
  });
}
