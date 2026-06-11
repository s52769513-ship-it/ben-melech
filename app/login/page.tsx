import LoginForm from "./LoginForm";
import LoginLogo from "./LoginLogo";

export default function LoginPage() {
  const envLogoUrl = process.env.NEXT_PUBLIC_LOGO_URL ?? "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] via-[#162d4a] to-[#0d1f33] p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <LoginLogo envLogoUrl={envLogoUrl} />
          <h1 className="text-4xl font-bold text-white tracking-wide mt-3">בן מלך</h1>
          <p className="text-blue-300 text-sm mt-1.5 tracking-widest">מערכת ניהול</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-[#1e3a5f] mb-1 text-center">כניסה למערכת</h2>
          <p className="text-gray-400 text-xs text-center mb-6">הזן פרטי כניסה לחשבונך</p>
          <LoginForm />
        </div>

        <p className="text-blue-400/60 text-xs text-center mt-6">
          © {new Date().getFullYear()} בן מלך
        </p>
      </div>
    </div>
  );
}
