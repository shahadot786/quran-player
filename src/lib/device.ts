export const DEVICE_KEY = "qp-device-id";

let fallback: string | null = null;

// Counts are kept per device so that two devices add up instead of overwriting each other.
export function getDeviceId(): string {
  try {
    const saved = localStorage.getItem(DEVICE_KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    // Without storage the id can't outlive the page, but it must stay the same within it.
    return (fallback ??= crypto.randomUUID());
  }
}
