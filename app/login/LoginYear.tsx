"use client";

import { useEffect, useState } from "react";

// The year is presentational; reading the clock while rendering would keep the
// login page out of the static shell, so it fills in after mount.
export default function LoginYear() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <>{year ?? ""}</>;
}
