"use client";

import { useEffect, useState } from "react";

interface PromptPayQRProps {
  phoneNumber: string;
  amount?: number;
  size?: number;
  className?: string;
}

export function PromptPayQR({ phoneNumber, amount, size = 120, className = "" }: PromptPayQRProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const [promptpayMod, QRCode] = await Promise.all([
          import("promptpay-qr"),
          import("qrcode"),
        ]);
        const generatePayload = (promptpayMod as any).default ?? promptpayMod;

        if (cancelled) return;

        const payload = generatePayload(phoneNumber.replace(/-/g, ""), { amount });
        const url = await QRCode.toDataURL(payload, {
          width: size * 2,
          margin: 2,
          color: { dark: "#1d1d1f", light: "#ffffff" },
        });

        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    if (phoneNumber && phoneNumber.replace(/-/g, "").length >= 9) {
      generate();
    }

    return () => { cancelled = true; };
  }, [phoneNumber, amount, size]);

  if (error) return null;
  if (!qrDataUrl) {
    return (
      <div
        className={`bg-canvas-parchment rounded-md flex items-center justify-center text-surface-chip ${className}`}
        style={{ width: size, height: size }}
      >
        <svg className="animate-pulse w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </div>
    );
  }

  return <img src={qrDataUrl} alt="PromptPay QR" className={className} style={{ width: size, height: size }} />;
}
