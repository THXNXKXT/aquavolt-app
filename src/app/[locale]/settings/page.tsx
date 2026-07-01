"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useMemo } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTransition } from "react";
import { SubNav } from "@/components/layout/sub-nav";
import { useSettings } from "@/hooks/use-settings";
import { formatCurrency } from "@/lib/formatters";
import toast from "react-hot-toast";
import {
  Check,
  Droplets,
  Zap,
  Building2,
  Home,
  Globe,
  FileText,
  CreditCard,
  Smartphone,
  Landmark,
  Lock,
} from "lucide-react";
import { changePassword } from "@/lib/auth-client";

type Tab = "general" | "payment" | "rates" | "security";

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { settings, updateSettings } = useSettings();

  const [activeTab, setActiveTab] = useState<Tab>("general");

  const [dormName, setDormName] = useState(settings.dormitoryName);
  const [address, setAddress] = useState(settings.dormitoryAddress);
  const [phone, setPhone] = useState(settings.phone);

  const [bankName, setBankName] = useState(settings.bankName);
  const [bankAccount, setBankAccount] = useState(settings.bankAccount);
  const [accountName, setAccountName] = useState(settings.accountName);
  const [promptpayNumber, setPromptpayNumber] = useState(settings.promptpayNumber);

  const [waterRate, setWaterRate] = useState(settings.waterRate);
  const [electricRate, setElectricRate] = useState(settings.electricRate);
  const [serviceCharge, setServiceCharge] = useState(settings.serviceCharge);
  const [wifiRate, setWifiRate] = useState(settings.wifiRate);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleSaveGeneral = () => {
    updateSettings({ dormitoryName: dormName, dormitoryAddress: address, phone });
    toast.success(t("toast.settingsSaved"));
  };

  const handleSavePayment = () => {
    updateSettings({ bankName, bankAccount, accountName, promptpayNumber });
    toast.success(t("toast.settingsSaved"));
  };

  const handleSaveRates = () => {
    updateSettings({ waterRate, electricRate, serviceCharge, wifiRate });
    toast.success(t("toast.settingsSaved"));
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(locale === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error(locale === "th" ? "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" : "Password must be at least 8 characters");
      return;
    }
    setPasswordSaving(true);
    try {
      const result = await changePassword({ currentPassword, newPassword, revokeOtherSessions: false });
      if (result.error) {
        toast.error(locale === "th" ? "รหัสผ่านปัจจุบันไม่ถูกต้อง" : "Current password is incorrect");
      } else {
        toast.success(locale === "th" ? "เปลี่ยนรหัสผ่านสำเร็จ" : "Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error(locale === "th" ? "เปลี่ยนรหัสผ่านไม่สำเร็จ" : "Failed to change password");
    }
    setPasswordSaving(false);
  };

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale as "en" | "th" });
    });
  };

  const preview = useMemo(() => {
    const w = 10 * waterRate;
    const e = 100 * electricRate;
    const wifi = wifiRate;
    return { water: w, electric: e, service: serviceCharge, wifi, total: w + e + serviceCharge + wifi };
  }, [waterRate, electricRate, serviceCharge, wifiRate]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "general", label: t("settings.general") },
    { key: "payment", label: t("settings.payment") },
    { key: "rates", label: t("rates.title") },
    { key: "security", label: locale === "th" ? "ความปลอดภัย" : "Security" },
  ];

  return (
    <div>
      <SubNav title={t("settings.title")} />
      <div className="max-w-[680px] mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-divider-soft rounded-full w-fit mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-ink shadow-sm"
                  : "text-[#86868b] hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════ GENERAL TAB ══════ */}
        {activeTab === "general" && (
          <div className="space-y-8">
            {/* Dormitory Info */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-sm bg-[#f0f7ff] flex items-center justify-center">
                  <Home className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="text-[15px] font-semibold text-ink">{t("settings.dormitoryName")}</h2>
              </div>
              <div className="bg-white rounded-[14px] border border-divider-soft divide-y divide-[#f0f0f0]">
                <div className="p-4 sm:p-5">
                  <label className="block text-xs font-medium text-[#86868b] mb-1.5">{t("settings.dormitoryName")}</label>
                  <input value={dormName} onChange={(e) => setDormName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="p-4 sm:p-5">
                  <label className="block text-xs font-medium text-[#86868b] mb-1.5">{t("settings.dormitoryAddress")}</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
                    className="w-full px-4 py-2.5 rounded-md border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
                <div className="p-4 sm:p-5">
                  <label className="block text-xs font-medium text-[#86868b] mb-1.5">{t("settings.phone")}</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="p-4 sm:p-5 flex justify-end">
                  <button onClick={handleSaveGeneral}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all">
                    <Check className="w-4 h-4" /> {t("settings.save")}
                  </button>
                </div>
              </div>
            </section>

            {/* Language */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-sm bg-[#f0f7ff] flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="text-[15px] font-semibold text-ink">{t("settings.language")}</h2>
              </div>
              <div className="bg-white rounded-[14px] border border-divider-soft p-2">
                <div className="flex gap-1">
                  <button onClick={() => switchLocale("th")} disabled={isPending}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${locale === "th" ? "bg-primary text-white shadow-sm" : "text-[#86868b] hover:text-ink hover:bg-canvas-parchment"}`}>
                    🇹🇭 {t("settings.thai")}
                  </button>
                  <button onClick={() => switchLocale("en")} disabled={isPending}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${locale === "en" ? "bg-primary text-white shadow-sm" : "text-[#86868b] hover:text-ink hover:bg-canvas-parchment"}`}>
                    🇺🇸 {t("settings.english")}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ══════ PAYMENT TAB ══════ */}
        {activeTab === "payment" && (
          <div className="space-y-6">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-sm bg-[#f0f7ff] flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="text-[15px] font-semibold text-ink">{t("settings.paymentTitle")}</h2>
              </div>
              <div className="bg-white rounded-[14px] border border-divider-soft divide-y divide-[#f0f0f0]">
                {/* Bank Transfer */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-[10px] bg-[#f0f7ff] flex items-center justify-center">
                      <Landmark className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-[13px] font-semibold text-ink">{t("invoices.bankTransfer")}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#86868b] mb-1">{t("settings.bankName")}</label>
                      <input value={bankName} onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#86868b] mb-1">{t("settings.bankAccount")}</label>
                      <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#86868b] mb-1">{t("settings.accountName")}</label>
                      <input value={accountName} onChange={(e) => setAccountName(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>
                {/* PromptPay */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-[10px] bg-[#f0f7ff] flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-[13px] font-semibold text-ink">{t("settings.promptpay")}</p>
                  </div>
                  <div className="max-w-xs">
                    <input value={promptpayNumber} onChange={(e) => setPromptpayNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>
            </section>

            {/* Save */}
            <div className="flex justify-end">
              <button onClick={handleSavePayment}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all">
                {t("settings.save")}
              </button>
            </div>
          </div>
        )}

        {/* ══════ RATES TAB ══════ */}
        {activeTab === "rates" && (
          <div className="space-y-6">
            <div className="bg-white rounded-[14px] border border-divider-soft divide-y divide-[#f0f0f0]">
              <div className="p-4 sm:p-5 flex items-center gap-4">
                <div className="w-9 h-9 rounded-[10px] bg-[#f0f7ff] flex items-center justify-center"><Droplets className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink">{t("rates.water")}</p>
                  <p className="text-[11px] text-[#86868b]">{t("rates.perCubicMeter")}</p>
                </div>
                <div className="relative w-28">
                  <input type="number" step="0.5" min="0" value={waterRate} onChange={(e) => setWaterRate(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-8 py-2 rounded-md border border-hairline text-sm font-semibold text-right focus:outline-none focus:ring-2 focus:ring-primary" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#a1a1a6]">฿</span>
                </div>
              </div>
              <div className="p-4 sm:p-5 flex items-center gap-4">
                <div className="w-9 h-9 rounded-[10px] bg-[#fff8ed] flex items-center justify-center"><Zap className="w-4 h-4 text-[#d97706]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink">{t("rates.electric")}</p>
                  <p className="text-[11px] text-[#86868b]">{t("rates.perKwh")}</p>
                </div>
                <div className="relative w-28">
                  <input type="number" step="0.5" min="0" value={electricRate} onChange={(e) => setElectricRate(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-8 py-2 rounded-md border border-hairline text-sm font-semibold text-right focus:outline-none focus:ring-2 focus:ring-[#d97706]" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#a1a1a6]">฿</span>
                </div>
              </div>
              <div className="p-4 sm:p-5 flex items-center gap-4">
                <div className="w-9 h-9 rounded-[10px] bg-canvas-parchment flex items-center justify-center"><Building2 className="w-4 h-4 text-[#6e6e73]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink">{t("rates.service")}</p>
                  <p className="text-[11px] text-[#86868b]">{t("rates.perMonth")}</p>
                </div>
                <div className="relative w-28">
                  <input type="number" step="10" min="0" value={serviceCharge} onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-8 py-2 rounded-md border border-hairline text-sm font-semibold text-right focus:outline-none focus:ring-2 focus:ring-primary" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#a1a1a6]">฿</span>
                </div>
              </div>
              <div className="p-4 sm:p-5 flex items-center gap-4">
                <div className="w-9 h-9 rounded-[10px] bg-[#f0f7ff] flex items-center justify-center">
                  <span className="w-4 h-4 text-primary flex items-center justify-center font-bold text-[10px]">WiFi</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink">ค่า WiFi</p>
                  <p className="text-[11px] text-[#86868b]">ค่าบริการอินเทอร์เน็ตต่อเดือน</p>
                </div>
                <div className="relative w-28">
                  <input type="number" step="50" min="0" value={wifiRate} onChange={(e) => setWifiRate(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-8 py-2 rounded-md border border-hairline text-sm font-semibold text-right focus:outline-none focus:ring-2 focus:ring-primary" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#a1a1a6]">฿</span>
                </div>
              </div>
            </div>

            {/* Bill Preview */}
            <div className="bg-white rounded-[14px] border border-divider-soft p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-[13px] font-semibold text-ink">{t("invoices.printTotalDue")} / Bill Preview</h3>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-divider-soft">
                <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">{t("invoices.printItem")}</span>
                <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">{t("invoices.printAmount")}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-[13px] border-b border-canvas-parchment">
                <span className="flex items-center gap-2 text-[#6e6e73]"><Home className="w-3.5 h-3.5 text-[#6e6e73]" /> {t("invoices.rentalCharge")}</span>
                <span className="font-medium text-ink">{formatCurrency(4500)}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-[13px] border-b border-canvas-parchment">
                <span className="flex items-center gap-2 text-[#6e6e73]"><Droplets className="w-3.5 h-3.5 text-primary" /> {t("rates.water")} (10 m³)</span>
                <span className="font-medium text-ink">{formatCurrency(preview.water)}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-[13px] border-b border-canvas-parchment">
                <span className="flex items-center gap-2 text-[#6e6e73]"><Zap className="w-3.5 h-3.5 text-[#d97706]" /> {t("rates.electric")} (100 kWh)</span>
                <span className="font-medium text-ink">{formatCurrency(preview.electric)}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-[13px] border-b border-canvas-parchment">
                <span className="flex items-center gap-2 text-[#6e6e73]"><Building2 className="w-3.5 h-3.5 text-[#6e6e73]" /> {t("rates.service")}</span>
                <span className="font-medium text-ink">{formatCurrency(preview.service)}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-[13px] border-b border-canvas-parchment">
                <span className="flex items-center gap-2 text-[#6e6e73]"><span className="w-3.5 h-3.5 text-primary font-bold text-[9px] flex items-center justify-center">WiFi</span> ค่า WiFi</span>
                <span className="font-medium text-ink">{formatCurrency(preview.wifi)}</span>
              </div>
              <div className="pt-3 flex items-center justify-between">
                <span className="text-[15px] font-bold text-ink">{t("invoices.printTotalDue")}</span>
                <span className="text-[17px] font-bold text-primary">{formatCurrency(4500 + preview.total)}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSaveRates}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all">
                {t("settings.save")}
              </button>
            </div>
          </div>
        )}

        {/* ══════ SECURITY TAB ══════ */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-sm bg-[#f0f7ff] flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="text-[15px] font-semibold text-ink">
                  {locale === "th" ? "เปลี่ยนรหัสผ่าน" : "Change Password"}
                </h2>
              </div>
              <div className="bg-white rounded-[14px] border border-divider-soft divide-y divide-[#f0f0f0]">
                <div className="p-4 sm:p-5">
                  <label className="block text-xs font-medium text-[#86868b] mb-1.5">
                    {locale === "th" ? "รหัสผ่านปัจจุบัน" : "Current Password"}
                  </label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="p-4 sm:p-5">
                  <label className="block text-xs font-medium text-[#86868b] mb-1.5">
                    {locale === "th" ? "รหัสผ่านใหม่" : "New Password"}
                  </label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" />
                  <p className="text-[11px] text-[#a1a1a6] mt-1">
                    {locale === "th" ? "อย่างน้อย 8 ตัวอักษร" : "At least 8 characters"}
                  </p>
                </div>
                <div className="p-4 sm:p-5">
                  <label className="block text-xs font-medium text-[#86868b] mb-1.5">
                    {locale === "th" ? "ยืนยันรหัสผ่านใหม่" : "Confirm New Password"}
                  </label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="p-4 sm:p-5 flex justify-end">
                  <button onClick={handleChangePassword} disabled={passwordSaving || !currentPassword || !newPassword}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100">
                    {passwordSaving ? "..." : (locale === "th" ? "เปลี่ยนรหัสผ่าน" : "Change Password")}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
