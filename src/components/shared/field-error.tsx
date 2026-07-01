"use client";

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
      <span className="w-1 h-1 rounded-full bg-red-600 inline-block" />
      {message}
    </p>
  );
}
