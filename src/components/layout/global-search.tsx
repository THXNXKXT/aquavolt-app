"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Search, DoorOpen, Users, FileText, X } from "lucide-react";
import { fetchRooms, fetchTenants, fetchInvoices } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import type { Room, Tenant, Invoice } from "@//types";

interface SearchResult {
  type: "room" | "tenant" | "invoice";
  label: string;
  sublabel: string;
  href: string;
  icon: React.ReactNode;
}

export function GlobalSearch() {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchData, setSearchData] = useState<{ rooms: Room[]; tenants: Tenant[]; invoices: Invoice[] }>({ rooms: [], tenants: [], invoices: [] });

  useEffect(() => {
    Promise.all([fetchRooms(), fetchTenants(), fetchInvoices()])
      .then(([rooms, tenants, invoices]) => setSearchData({ rooms, tenants, invoices }))
      .catch(() => {});
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const roomStatusLabel = (status: string) => {
    switch (status) {
      case "occupied": return t("rooms.occupied");
      case "vacant": return t("rooms.vacant");
      case "maintenance": return t("rooms.maintenance");
      default: return status;
    }
  };

  const typeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "room": return t("search.typeRoom");
      case "tenant": return t("search.typeTenant");
      case "invoice": return t("search.typeInvoice");
    }
  };

  const q = query.toLowerCase().trim();

  const results: SearchResult[] = (() => {
    if (!q) return [];
    const r: SearchResult[] = [];

    searchData.rooms.forEach((room) => {
      if (room.roomNumber.toLowerCase().includes(q) || room.buildingName?.toLowerCase().includes(q)) {
        r.push({
          type: "room", label: room.roomNumber, sublabel: `${room.buildingName ?? ""} · ${roomStatusLabel(room.status)}`,
          href: "/rooms", icon: <DoorOpen className="w-3.5 h-3.5 text-primary" />,
        });
      }
    });

    searchData.tenants.forEach((ten) => {
      if (ten.name.toLowerCase().includes(q) || ten.phone.includes(q) || ten.lineId?.toLowerCase().includes(q)) {
        r.push({
          type: "tenant", label: ten.name, sublabel: `${ten.roomNumber ?? ""} · ${ten.phone}`,
          href: "/tenants", icon: <Users className="w-3.5 h-3.5 text-green-600" />,
        });
      }
    });

    searchData.invoices.forEach((inv) => {
      if (inv.invoiceNumber.toLowerCase().includes(q) || inv.tenantName?.toLowerCase().includes(q) || inv.roomNumber?.toLowerCase().includes(q)) {
        r.push({
          type: "invoice", label: inv.invoiceNumber, sublabel: `${inv.roomNumber ?? ""} · ${inv.tenantName ?? ""} · ${formatCurrency(inv.totalAmount)}`,
          href: `/invoices/${inv.id}`, icon: <FileText className="w-3.5 h-3.5 text-amber-600" />,
        });
      }
    });

    return r.slice(0, 10);
  })();

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <>
      {/* Trigger button in nav */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[11px] text-[#86868b] bg-canvas-parchment rounded-full px-3 py-1.5 hover:bg-[#e8e8ed] transition-colors"
      >
        <Search className="w-3 h-3" />
        <span className="hidden sm:inline">{t("common.search")}</span>
        <kbd className="hidden sm:inline text-[9px] text-[#a1a1a6] border border-surface-chip rounded px-1">⌘K</kbd>
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] bg-black/20 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
          <motion.div
            ref={containerRef}
            className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-hairline overflow-hidden"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-divider-soft">
              <Search className="w-4 h-4 text-[#a1a1a6] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="flex-1 text-sm text-ink outline-none placeholder:text-[#a1a1a6]"
              />
              {query && (
                <button onClick={() => setQuery("")} className="p-1 rounded-full hover:bg-canvas-parchment">
                  <X className="w-3.5 h-3.5 text-[#a1a1a6]" />
                </button>
              )}
              <kbd className="text-[10px] text-[#a1a1a6] border border-surface-chip rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {results.length === 0 && query && (
                <div className="px-4 py-8 text-center text-[13px] text-[#86868b]">
                  {t("search.noResults", { query })}
                </div>
              )}
              {results.length === 0 && !query && (
                <div className="px-4 py-8 text-center text-[13px] text-[#86868b]">
                  {t("search.empty")}
                </div>
              )}
              {results.map((r, i) => (
                <button
                  key={`${r.type}-${r.label}-${i}`}
                  onClick={() => handleSelect(r.href)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-canvas-parchment transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-canvas-parchment flex items-center justify-center shrink-0">
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink truncate">{r.label}</p>
                    <p className="text-[11px] text-[#86868b] truncate">{r.sublabel}</p>
                  </div>
                  <span className={`text-[9px] font-medium uppercase ${
                    r.type === "room" ? "text-primary" : r.type === "tenant" ? "text-green-600" : "text-amber-600"
                  }`}>
                    {typeLabel(r.type)}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
