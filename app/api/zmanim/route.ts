import { NextResponse } from "next/server";
import { HDate, GeoLocation, Zmanim } from "@hebcal/core";
import { DafYomi } from "@hebcal/learning";

// Jerusalem
const GLOC = new GeoLocation("Jerusalem", 31.7683, 35.2137, 800, "Asia/Jerusalem");

function toISO(d: Date | null | undefined): string | undefined {
  return d ? d.toISOString() : undefined;
}

export async function GET() {
  const today = new Date();
  const z = new Zmanim(GLOC, today, false);

  // Hebrew date
  const hd = new HDate(today);
  const hebrewDate = hd.renderGematriya();

  // Daf Yomi
  let dafYomi = "";
  try {
    const dy = new DafYomi(today);
    dafYomi = dy.render("he");
  } catch {
    dafYomi = "";
  }

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

  return NextResponse.json({
    hebrewDate,
    dafYomi,
    times,
    isFriday: today.getDay() === 5,
  });
}
