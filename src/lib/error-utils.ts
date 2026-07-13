import toast from "react-hot-toast";

/**
 * Safe API call with automatic error logging and user-facing toast.
 * Returns [data, error].
 */
export async function safeApi<T>(
  promise: Promise<T>,
  label?: string
): Promise<[T | null, string | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
    toast.error(`${label || "ระบบ"} ล้มเหลว: ${msg}`);
    return [null, msg];
  }
}
