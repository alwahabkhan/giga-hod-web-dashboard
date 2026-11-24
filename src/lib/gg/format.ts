const TZ = "Asia/Karachi";
export const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString("en-PK")}`;
export const pkrShort = (n: number) => n >= 1e9 ? `PKR ${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `PKR ${(n / 1e6).toFixed(1)}M` : pkr(n);
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ });
export const fmtDateTime = (iso: string) => `${fmtDate(iso)}, ${new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ })}`;
export function age(iso: string, now: number) {
  const h = (now - Date.parse(iso)) / 3600000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
  if (h < 48) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}
export function toCsv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(",")).join("\n");
}
export function downloadCsv(name: string, rows: (string | number)[][]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${name}.csv`; a.click(); URL.revokeObjectURL(a.href);
}
