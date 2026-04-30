import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatPeriod, formatRupiah, monthNames, periodKey } from "@/lib/format";
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, Search, TrendingUp, Users, Wallet, XCircle } from "lucide-react";

interface Member { id: string; name: string; block: string | null; phone: string | null; active: boolean; }
interface MonthlyDue { id: string; period: string; amount: number; notes: string | null; }
interface Payment { id: string; member_id: string; period: string; amount: number; paid_at: string; }
interface Transaction { id: string; type: "income" | "expense"; category: string; description: string | null; amount: number; date: string; }

const Index = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [search, setSearch] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [dues, setDues] = useState<MonthlyDue[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);

  const period = periodKey(year, month);

  const load = async () => {
    const [m, d, p, t] = await Promise.all([
      supabase.from("members").select("*").order("name"),
      supabase.from("monthly_dues").select("*").order("period", { ascending: false }),
      supabase.from("payments").select("*"),
      supabase.from("transactions").select("*").order("date", { ascending: false }),
    ]);
    setMembers((m.data as any) || []);
    setDues((d.data as any) || []);
    setPayments((p.data as any) || []);
    setTxs((t.data as any) || []);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("public-feed")
      .on("postgres_changes", { event: "*", schema: "public" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const currentDue = dues.find((d) => d.period === period);
  const activeMembers = members.filter((m) => m.active);

  const paidThisPeriod = useMemo(
    () => new Set(payments.filter((p) => p.period === period).map((p) => p.member_id)),
    [payments, period]
  );

  const filtered = activeMembers.filter((m) =>
    `${m.name} ${m.block ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const paid = filtered.filter((m) => paidThisPeriod.has(m.id));
  const unpaid = filtered.filter((m) => !paidThisPeriod.has(m.id));

  // Hutang: jumlah bulan yang belum dibayar dari periode awal sampai bulan SEBELUMNYA
  const debtFor = (memberId: string) => {
    const memberPaid = new Set(payments.filter((p) => p.member_id === memberId).map((p) => p.period));
    let total = 0;
    const months: string[] = [];
    for (const due of dues) {
      if (due.period >= period) continue; // hanya bulan-bulan lampau
      if (!memberPaid.has(due.period)) {
        total += Number(due.amount);
        months.push(formatPeriod(due.period));
      }
    }
    return { total, months };
  };

  const totalIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0)
    + payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const years = Array.from(new Set([now.getFullYear(), ...dues.map((d) => new Date(d.period).getFullYear())])).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="gradient-hero text-primary-foreground">
        <div className="container py-8 sm:py-12 md:py-16">
          <Badge variant="secondary" className="mb-3 sm:mb-4 bg-white/20 text-primary-foreground border-0 backdrop-blur">
            Laporan Real-time
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight max-w-3xl">
            Transparansi Iuran Rukun Kematian Masyarakat
          </h1>
          <p className="mt-3 text-sm sm:text-base text-primary-foreground/85 max-w-2xl">
            Perumahan Nawa Residence — pantau status pembayaran iuran, pemasukan, dan pengeluaran kas RKM kapan saja.
          </p>

          <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Wallet />} label="Saldo Kas" value={formatRupiah(balance)} accent />
            <StatCard icon={<ArrowUpCircle />} label="Total Pemasukan" value={formatRupiah(totalIncome)} />
            <StatCard icon={<ArrowDownCircle />} label="Total Pengeluaran" value={formatRupiah(totalExpense)} />
            <StatCard icon={<Users />} label="Peserta Aktif" value={String(activeMembers.length)} />
          </div>
        </div>
      </section>

      <main className="container py-6 sm:py-8 space-y-6">
        {/* Period Selector */}
        <Card className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <h2 className="text-lg font-semibold">Periode Iuran</h2>
              <p className="text-sm text-muted-foreground">
                {currentDue
                  ? <>Iuran <strong>{formatPeriod(period)}</strong>: {formatRupiah(currentDue.amount)}</>
                  : <>Belum ada iuran untuk <strong>{formatPeriod(period)}</strong></>}
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="flex-1 md:w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="flex-1 md:w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <MiniStat label="Sudah Bayar" value={paid.length} tone="success" />
            <MiniStat label="Belum Bayar" value={unpaid.length} tone="warning" />
            <MiniStat label="Total Terkumpul" value={formatRupiah(payments.filter((p) => p.period === period).reduce((s, p) => s + Number(p.amount), 0))} />
            <MiniStat label="Target Bulan Ini" value={formatRupiah((currentDue?.amount || 0) * activeMembers.length)} />
          </div>
        </Card>

        <Tabs defaultValue="status">
          <TabsList className="grid grid-cols-3 w-full md:w-auto md:inline-flex h-auto">
            <TabsTrigger value="status" className="text-xs sm:text-sm whitespace-normal py-2">Status Pembayaran</TabsTrigger>
            <TabsTrigger value="cashflow" className="text-xs sm:text-sm whitespace-normal py-2">Pemasukan & Pengeluaran</TabsTrigger>
            <TabsTrigger value="dues" className="text-xs sm:text-sm whitespace-normal py-2">Riwayat Iuran</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Cari nama atau blok..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <h3 className="font-semibold">Sudah Bayar ({paid.length})</h3>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {paid.length === 0 && <p className="text-sm text-muted-foreground">Belum ada yang membayar.</p>}
                  {paid.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                      <div>
                        <div className="font-medium">{m.name}</div>
                        {m.block && <div className="text-xs text-muted-foreground">Blok {m.block}</div>}
                      </div>
                      <Badge className="bg-success text-success-foreground hover:bg-success">Lunas</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold">Belum Bayar ({unpaid.length})</h3>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {unpaid.length === 0 && <p className="text-sm text-muted-foreground">Semua peserta sudah membayar 🎉</p>}
                  {unpaid.map((m) => {
                    const debt = debtFor(m.id);
                    return (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.block ? `Blok ${m.block}` : ""}
                            {debt.total > 0 && (
                              <span className="ml-2 text-destructive font-medium">
                                · Hutang {debt.months.length} bulan: {formatRupiah(debt.total)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="border-warning text-warning">Belum</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cashflow" className="mt-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Riwayat Transaksi Kas</h3>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {txs.length === 0 && <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>}
                {txs.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      {t.type === "income"
                        ? <ArrowUpCircle className="h-5 w-5 text-success" />
                        : <ArrowDownCircle className="h-5 w-5 text-destructive" />}
                      <div>
                        <div className="font-medium">{t.category}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          {t.description && ` · ${t.description}`}
                        </div>
                      </div>
                    </div>
                    <div className={`font-semibold ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                      {t.type === "income" ? "+" : "-"}{formatRupiah(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="dues" className="mt-4">
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Nominal Iuran per Periode</h3>
              <div className="space-y-2">
                {dues.length === 0 && <p className="text-sm text-muted-foreground">Belum ada iuran.</p>}
                {dues.map((d) => {
                  const collected = payments.filter((p) => p.period === d.period).length;
                  return (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <div className="font-medium">{formatPeriod(d.period)}</div>
                        <div className="text-xs text-muted-foreground">{collected} / {activeMembers.length} peserta lunas</div>
                      </div>
                      <div className="font-semibold text-primary">{formatRupiah(d.amount)}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border py-6 mt-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {now.getFullYear()} RKM Perumahan Nawa Residence · Laporan Transparan Real-time
        </div>
      </footer>
    </div>
  );
};

const StatCard = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) => (
  <div className={`rounded-xl p-3 sm:p-4 backdrop-blur ${accent ? "bg-white/20 border border-white/30" : "bg-white/10 border border-white/20"}`}>
    <div className="flex items-center gap-2 text-primary-foreground/85 text-xs sm:text-sm">
      <span className="h-4 w-4">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
    <div className="text-lg sm:text-2xl font-bold mt-1 break-words">{value}</div>
  </div>
);

const MiniStat = ({ label, value, tone }: { label: string; value: string | number; tone?: "success" | "warning" }) => (
  <div className={`rounded-lg p-3 border ${tone === "success" ? "border-success/30 bg-success/5" : tone === "warning" ? "border-warning/30 bg-warning/5" : "border-border bg-muted/30"}`}>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className={`font-bold ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground"}`}>{value}</div>
  </div>
);

export default Index;
