import * as XLSX from "xlsx";
import { formatPeriod } from "./format";

interface Member { id: string; name: string; block: string | null; phone: string | null; active: boolean; }
interface Due { id: string; period: string; amount: number; notes: string | null; }
interface Payment { id: string; member_id: string; period: string; amount: number; paid_at: string; }
interface Tx { id: string; type: string; category: string; description: string | null; amount: number; date: string; }

export const exportLaporan = (
  members: Member[],
  dues: Due[],
  payments: Payment[],
  txs: Tx[]
) => {
  const wb = XLSX.utils.book_new();

  // Sheet Peserta
  const wsMembers = XLSX.utils.json_to_sheet(
    members.map((m) => ({
      Nama: m.name,
      Blok: m.block ?? "",
      Telepon: m.phone ?? "",
      Status: m.active ? "Aktif" : "Non-aktif",
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsMembers, "Peserta");

  // Sheet Iuran
  const wsDues = XLSX.utils.json_to_sheet(
    dues.map((d) => ({
      Periode: formatPeriod(d.period),
      Nominal: Number(d.amount),
      Catatan: d.notes ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsDues, "Iuran Bulanan");

  // Sheet Pembayaran
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const wsPay = XLSX.utils.json_to_sheet(
    payments.map((p) => {
      const m = memberMap.get(p.member_id);
      return {
        Periode: formatPeriod(p.period),
        Nama: m?.name ?? "(tidak ditemukan)",
        Blok: m?.block ?? "",
        Nominal: Number(p.amount),
        "Tanggal Bayar": p.paid_at,
      };
    })
  );
  XLSX.utils.book_append_sheet(wb, wsPay, "Pembayaran");

  // Sheet Kas
  const wsTx = XLSX.utils.json_to_sheet(
    txs.map((t) => ({
      Tanggal: t.date,
      Jenis: t.type === "income" ? "Pemasukan" : "Pengeluaran",
      Kategori: t.category,
      Keterangan: t.description ?? "",
      Nominal: Number(t.amount),
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsTx, "Kas");

  // Sheet Matriks Status (peserta x periode)
  const periods = [...dues].sort((a, b) => a.period.localeCompare(b.period));
  const paidSet = new Set(payments.map((p) => `${p.member_id}|${p.period}`));
  const matrix = members
    .filter((m) => m.active)
    .map((m) => {
      const row: Record<string, string> = { Nama: m.name, Blok: m.block ?? "" };
      for (const d of periods) {
        row[formatPeriod(d.period)] = paidSet.has(`${m.id}|${d.period}`) ? "Lunas" : "Belum";
      }
      return row;
    });
  if (matrix.length > 0) {
    const wsMatrix = XLSX.utils.json_to_sheet(matrix);
    XLSX.utils.book_append_sheet(wb, wsMatrix, "Status Per Bulan");
  }

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Laporan-RKM-Nawa-${today}.xlsx`);
};
