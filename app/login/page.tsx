import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] via-[#162d4a] to-[#0d1f33] p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Brand card */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-xl">
            <span className="text-4xl">👑</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-wide">בן מלך</h1>
          <p className="text-blue-300 text-sm mt-1.5 tracking-widest">מערכת ניהול</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-white/20">
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
