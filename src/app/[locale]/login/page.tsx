"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { useAuth } from "@/lib/auth-context";
import { Grip } from "lucide-react";

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
      <div className="lg:w-1/2 bg-canvas-parchment flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16">
        <div className="max-w-md text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
            <Grip className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight text-ink">
              AquaVolt
            </span>
          </div>
          <h1 className="text-[40px] sm:text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-ink mb-4">
            {t("title")}
          </h1>
          <p className="text-[17px] sm:text-[21px] font-semibold tracking-[0.231px] text-[#86868b]">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Grip className="w-5 h-5 text-primary" />
              <span className="text-lg font-semibold tracking-tight text-ink">
                AquaVolt
              </span>
            </div>
          </div>

          <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-[0.196px] text-ink mb-1">
            {t("title")}
          </h2>
          <p className="text-[15px] text-[#86868b] mb-8">{t("subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#6e6e73] mb-1.5 tracking-[-0.12px]">
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholder.email")}
                className="w-full px-4 py-3 rounded-md border border-hairline text-sm text-ink bg-surface-pearl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#6e6e73] mb-1.5 tracking-[-0.12px]">
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("placeholder.password")}
                className="w-full px-4 py-3 rounded-md border border-hairline text-sm text-ink bg-surface-pearl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-md">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-primary text-white text-[15px] font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t("submit")}
                </span>
              ) : (
                t("submit")
              )}
            </button>

            <p className="text-xs text-[#86868b] text-center mt-6">
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
