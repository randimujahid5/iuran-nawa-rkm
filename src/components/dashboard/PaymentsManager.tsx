import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, CheckCircle2, Search, X } from "lucide-react";
import { formatPeriod, formatRupiah, monthNames, periodKey } from "@/lib/format";

interface Member { id: string; name: string; block: string | null; active: boolean; }
interface Due { id: string; period: string; amount: number; }
interface Payment { id: string; member_id: string; period: string; amount: number; }

const PaymentsManager = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [search, setSearch] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [dues, setDues] = useState<Due[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const period = periodKey(year, month);
  const currentDue = dues.find((d) => d.period === period);

  const load = async () => {
    const [m, d, p] = await Promise.all([
      supabase.from("members").select("*").eq("active", true).order("name"),
      supabase.from("monthly_dues").select("*"),
      supabase.from("payments").select("*"),
    ]);
    setMembers((m.data as any) || []);
    setDues((d.data as any) || []);
    setPayments((p.data as any) || []);
  };

  useEffect(() => { load(); }, []);

  const paidIds = useMemo(
    () => new Set(payments.filter((p) => p.period === period).map((p) => p.member_id)),
    [payments, period]
  );

  const togglePaid = async (memberId: string) => {
    if (!currentDue) { toast.error("Tetapkan nominal iuran untuk periode ini terlebih dulu"); return; }
    if (paidIds.has(memberId)) {
      const pay = payments.find((p) => p.member_id === memberId && p.period === period);
      if (!pay) return;
      const { error } = await supabase.from("payments").delete().eq("id", pay.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Pembayaran dibatalkan");
    } else {
      const { error } = await supabase.from("payments").insert({
        member_id: memberId,
        period,
        amount: currentDue.amount,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Pembayaran dicatat");
    }
    load();
  };

  const filtered = members.filter((m) => `${m.name} ${m.block ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i);

  const debtFor = (memberId: string) => {
    const memberPaid = new Set(payments.filter((p) => p.member_id === memberId).map((p) => p.period));
    let total = 0; let count = 0;
    for (const due of dues) {
      if (due.period >= period) continue;
      if (!memberPaid.has(due.period)) { total += Number(due.amount); count++; }
    }
    return { total, count };
  };

  return (
    <Card className="p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Catat Pembayaran</h3>
          <p className="text-sm text-muted-foreground">
            Periode <strong>{formatPeriod(period)}</strong>
            {currentDue ? <> · Iuran {formatRupiah(currentDue.amount)}</> : <span className="text-warning"> · Belum ada nominal iuran</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Cari peserta..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map((m) => {
          const isPaid = paidIds.has(m.id);
          const debt = debtFor(m.id);
          return (
            <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border ${isPaid ? "bg-success/5 border-success/30" : "border-border"}`}>
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">
                  {m.block && <>Blok {m.block}</>}
                  {debt.count > 0 && <span className="ml-2 text-destructive font-medium">Hutang {debt.count} bulan: {formatRupiah(debt.total)}</span>}
                </div>
              </div>
              <Button
                variant={isPaid ? "outline" : "default"}
                size="sm"
                onClick={() => togglePaid(m.id)}
                className="gap-2"
              >
                {isPaid ? <><X className="h-4 w-4" /> Batalkan</> : <><Check className="h-4 w-4" /> Tandai Lunas</>}
              </Button>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Tidak ada peserta.</p>}
      </div>
    </Card>
  );
};

export default PaymentsManager;
