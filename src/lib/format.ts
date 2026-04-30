export const formatRupiah = (n: number | string) => {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num || 0);
};

export const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const formatPeriod = (period: string) => {
  const d = new Date(period);
  return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
};

export const periodKey = (year: number, month: number) => {
  // month: 0-11 -> first day of month YYYY-MM-01
  const m = String(month + 1).padStart(2, "0");
  return `${year}-${m}-01`;
};

export const currentPeriod = () => {
  const d = new Date();
  return periodKey(d.getFullYear(), d.getMonth());
};
