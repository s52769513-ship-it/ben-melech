import LoginForm from "./LoginForm";
import LoginLogo from "./LoginLogo";
import LoginStars from "./LoginStars";

export default function LoginPage() {
  const envLogoUrl = process.env.NEXT_PUBLIC_LOGO_URL ?? "";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #1e3a5f 0%, #0e2040 55%, #060e1a 100%)",
      }}
    >
      {/* Star field */}
      <LoginStars />

      {/* Ambient glow orbs */}
      <div
        className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none login-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
          animation: "glow-pulse 4s 1.5s ease-in-out infinite",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo + orbits */}
        <div className="flex flex-col items-center mb-10 animate-float-up">
          <div className="relative flex items-center justify-center" style={{ width: 360, height: 360 }}>
            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-full login-glow"
              style={{
                background:
                  "radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 65%)",
              }}
            />

            {/* Outer orbit ring */}
            <div
              className="absolute rounded-full border border-blue-400/25 login-orbit-ccw"
              style={{ width: 352, height: 352 }}
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-300/80 rounded-full shadow-[0_0_10px_rgba(147,197,253,0.8)]" />
              <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-blue-200/60 rounded-full" />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-300/50 rounded-full" />
            </div>

            {/* Inner orbit ring */}
            <div
              className="absolute rounded-full border border-blue-300/20 login-orbit-cw"
              style={{ width: 272, height: 272 }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-indigo-300/90 rounded-full shadow-[0_0_7px_rgba(165,180,252,0.9)]" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400/70 rounded-full" />
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-blue-200/60 rounded-full" />
            </div>

            {/* Logo */}
            <div className="relative w-56 h-56 flex items-center justify-center login-logo-enter">
              <LoginLogo envLogoUrl={envLogoUrl} large />
            </div>
          </div>
        </div>

        {/* Glass card */}
        <div
          className="rounded-3xl p-8 animate-float-up"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            animationDelay: "0.15s",
          }}
        >
          <h2 className="text-xl font-bold text-white mb-1 text-center">כניסה למערכת</h2>
          <p className="text-blue-200/50 text-xs text-center mb-7 tracking-wide">
            הזן פרטי כניסה לחשבונך
          </p>
          <LoginForm />
        </div>

        <p className="text-blue-400/30 text-xs text-center mt-6">
          © {new Date().getFullYear()} בן מלך
        </p>
      </div>
    </div>
  );
}
