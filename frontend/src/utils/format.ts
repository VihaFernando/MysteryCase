import { formatDistanceToNowStrict, format } from "date-fns";

export const fmtDate = (iso?: string) => (iso ? format(new Date(iso), "MMM d, yyyy") : "—");
export const fmtDateTime = (iso?: string) => (iso ? format(new Date(iso), "MMM d, yyyy h:mm a") : "—");
export const fmtTime = (d: Date) => format(d, "h:mm a");
export const fmtAgo = (iso?: string) => (iso ? `${formatDistanceToNowStrict(new Date(iso))} ago` : "—");
export const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n);
export const fmtClock = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
};
export const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
