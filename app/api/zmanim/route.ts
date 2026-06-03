import { NextResponse } from "next/server";

const GEO_ID = 281184; // Jerusalem

export async function GET() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const [y, m, d] = dateStr.split("-");

  try {
    const [zmanimRes, converterRes, learningRes] = await Promise.all([
      fetch(`https://www.hebcal.com/zmanim?cfg=json&geonameid=${GEO_ID}&date=${dateStr}`, {
        next: { revalidate: 3600 },
      }),
      fetch(`https://www.hebcal.com/converter?cfg=json&g2h=1&gy=${y}&gm=${m}&gd=${d}`, {
        next: { revalidate: 86400 },
      }),
      fetch(`https://www.hebcal.com/learning?cfg=json&v=1&daf_yomi=on&start=${dateStr}&end=${dateStr}`, {
        next: { revalidate: 86400 },
      }),
    ]);

    if (!zmanimRes.ok) {
      return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
    }

    const [zmanimJson, converterJson, learningJson] = await Promise.all([
      zmanimRes.json(),
      converterRes.ok ? converterRes.json() : {},
      learningRes.ok ? learningRes.json() : {},
    ]);

    type DafItem = { category: string; hebrew?: string; title?: string };
    const dafItem = ((learningJson as { items?: DafItem[] }).items ?? [])
      .find((i) => i.category === "dafyomi");

    return NextResponse.json({
      hebrewDate: (converterJson as { hebrew?: string }).hebrew ?? "",
      dafYomi: dafItem?.hebrew ?? dafItem?.title ?? "",
      times: (zmanimJson as { times?: Record<string, string> }).times ?? {},
      isFriday: today.getDay() === 5,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
