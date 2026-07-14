"use client";

import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-40 px-6 py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-[13px] font-semibold text-ink mb-1">เกิดข้อผิดพลาด</h3>
          <p className="text-[11px] text-[#86868b] mb-4 max-w-sm">
            {this.state.error?.message || "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[11px] font-medium rounded-full hover:bg-primary-focus transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> ลองใหม่
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
