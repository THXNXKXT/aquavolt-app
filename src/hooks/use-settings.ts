"use client";

import { useState, useCallback, useEffect } from "react";

export interface AppSettings {
  dormitoryName: string;
  dormitoryAddress: string;
  phone: string;
  waterRate: number;
  electricRate: number;
  serviceCharge: number;
  bankName: string;
  bankAccount: string;
  accountName: string;
  promptpayNumber: string;
  wifiRate: number;
}

const STORAGE_KEY = "aquavolt-settings";

const defaultSettings: AppSettings = {
  dormitoryName: "AquaVolt Dormitory",
  dormitoryAddress: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  phone: "02-123-4567",
  waterRate: 18,
  electricRate: 8,
  serviceCharge: 500,
  bankName: "ธนาคารกสิกรไทย",
  bankAccount: "XXX-X-XXXXX-X",
  accountName: "ชื่อบัญชีหอพัก",
  promptpayNumber: "XXX-XXX-XXXX",
  wifiRate: 300,
};

function loadLocal(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {}
  return defaultSettings;
}

function saveLocal(settings: AppSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
}

async function fetchApiSettings(): Promise<Partial<AppSettings> | null> {
  try {
    const res = await fetch("/api/settings");
    if (!res.ok) return null;
    const data = await res.json();
    const result: Record<string, any> = {};
    // Parse numeric fields
    for (const [key, value] of Object.entries(data)) {
      if (["waterRate", "electricRate", "serviceCharge", "wifiRate"].includes(key)) {
        result[key] = parseFloat(value as string) || 0;
      } else {
        result[key] = value;
      }
    }
    return result as Partial<AppSettings>;
  } catch { return null; }
}

async function saveApiSettings(partial: Partial<AppSettings>) {
  try {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
  } catch {}
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadLocal);

  // Load from API on mount and merge with localStorage
  useEffect(() => {
    fetchApiSettings().then((apiData) => {
      if (apiData) {
        setSettingsState((prev) => {
          const merged = { ...prev, ...apiData };
          saveLocal(merged);
          return merged;
        });
      }
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...partial };
      saveLocal(updated);
      return updated;
    });
    // Persist to API in background
    saveApiSettings(partial);
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(defaultSettings);
    saveLocal(defaultSettings);
  }, []);

  return { settings, updateSettings, resetSettings };
}
