"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";

type LoginResult =
  | { success: true; name: string }
  | { success: false; error: string };

function WelcomeModal({ name }: { name: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl px-10 py-12 max-w-sm w-full mx-4 text-center animate-scale-in">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100">
          <svg
            className="w-12 h-12 text-green-500"
            viewBox="0 0 52 52"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="26" cy="26" r="24" className="stroke-green-200" strokeWidth="2" />
            <path
              d="M14 26l8 8 16-16"
              strokeDasharray="100"
              strokeDashoffset="100"
              style={{ animation: "checkDraw 0.5s 0.3s ease forwards" }}
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-[#1e3a5f] mb-1">ברוכים הבאים</h2>
        <p className="text-2xl font-semibold text-gray-700 mt-2">
          הרב {name} שליט&quot;א
        </p>
        <p className="text-sm text-gray-400 mt-6">מועבר למערכת...</p>
        <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1e3a5f] rounded-full"
            style={{ animation: "progressBar 3s linear forwards" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<LoginResult | null, FormData>(
    loginAction,
    null
  );
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setShowWelcome(true);
      const t = setTimeout(() => router.push("/exams"), 3000);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  const inputClass =
    "w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-all";
  const inputStyle = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
  };

  return (
    <>
      <form action={action} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-blue-100/80">
            מספר טלפון
          </label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-lg select-none">
              📱
            </span>
            <input
              name="phone"
              type="tel"
              dir="ltr"
              placeholder="050-0000000"
              required
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-blue-100/80">
            תעודת זהות
          </label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-lg select-none">
              🪪
            </span>
            <input
              name="id_number"
              type="text"
              inputMode="numeric"
              dir="ltr"
              placeholder="000000000"
              required
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>

        {state && !state.success && (
          <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm rounded-xl px-4 py-3 text-center animate-fade-in">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1e3a5f 100%)",
            boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
            color: "white",
          }}
        >
          {pending ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              מתחבר...
            </>
          ) : (
            "כניסה למערכת"
          )}
        </button>
      </form>

      {showWelcome && state?.success && <WelcomeModal name={state.name} />}
    </>
  );
}
