"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/shared/logo";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const ok = await login(email, password);
    if (ok) {
      router.push("/dashboard");
    } else {
      setError(t("error"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Brand panel */}
      <div className="lg:w-[45%] bg-gradient-to-br from-[#0071e3] to-[#005bb5] flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 relative overflow-hidden">
        {/* Decorative water drop pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100 20C100 20 60 80 60 130C60 160 77 180 100 180C123 180 140 160 140 130C140 80 100 20 100 20Z' fill='white'/%3E%3C/svg%3E")`,
          backgroundSize: "240px",
          backgroundRepeat: "repeat",
        }} />

        <div className="relative max-w-md text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2.5 mb-12">
            <Logo size={44} className="" />
            <span className="text-[21px] font-semibold tracking-[-0.03em] text-white">
              AquaVolt
            </span>
          </div>
          <h1 className="text-[36px] sm:text-[48px] font-semibold leading-[1.08] tracking-[-0.03em] text-white mb-5">
            {t("title")}
          </h1>
          <p className="text-[17px] leading-relaxed text-white/60">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 bg-canvas-parchment">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <Logo size={36} className="" />
            <span className="text-[18px] font-semibold tracking-[-0.03em] text-ink">
              AquaVolt
            </span>
          </div>

          <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-ink mb-1.5">
            {t("title")}
          </h2>
          <p className="text-[14px] text-[#86868b] mb-8">{t("subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-medium text-[#86868b] mb-2 tracking-[0.08em] uppercase">
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholder.email")}
                className="w-full px-4 py-3 rounded-[12px] border border-hairline text-[14px] text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#86868b] mb-2 tracking-[0.08em] uppercase">
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("placeholder.password")}
                className="w-full px-4 py-3 rounded-[12px] border border-hairline text-[14px] text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-[12px] text-red-600 bg-red-50 px-4 py-2.5 rounded-[10px]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-primary text-white text-[15px] font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("submit")}
                </span>
              ) : (
                t("submit")
              )}
            </button>

            <p className="text-[11px] text-[#86868b] text-center mt-6">
              {t("hint") || ""}
            </p>
          </form>

          <div className="flex justify-center mt-8">
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
