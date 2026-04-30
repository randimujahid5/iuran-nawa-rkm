import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/format";

interface Tx { id: string; type: "income" | "expense"; category: string; description: string | null; amount: number; date: string; }

const TransactionsManager = () => {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "income" as "income" | "expense", category: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false });
    setTxs((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.category.trim()) { toast.error("Kategori wajib diisi"); return; }
    const num = parseFloat(form.amount);
    if (!num || num <= 0) { toast.error("Nominal harus lebih dari 0"); return; }
    const { error } = await supabase.from("transactions").insert({
      type: form.type,
      category: form.category.trim(),
      description: form.description.trim() || null,
      amount: num,
      date: form.date,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Transaksi dicatat");
    setOpen(false);
    setForm({ type: "income", category: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Dihapus"); load();
  };

  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Wallet className="h-5 w-5" /> Kas RKM</h3>
          <p className="text-sm text-muted-foreground">Catat pemasukan & pengeluaran di luar iuran</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Tambah</Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg p-3 bg-success/10 border border-success/30">
          <div className="text-xs text-muted-foreground">Pemasukan Tambahan</div>
          <div className="font-bold text-success">{formatRupiah(income)}</div>
        </div>
        <div className="rounded-lg p-3 bg-destructive/10 border border-destructive/30">
          <div className="text-xs text-muted-foreground">Pengeluaran</div>
          <div className="font-bold text-destructive">{formatRupiah(expense)}</div>
        </div>
        <div className="rounded-lg p-3 bg-primary/10 border border-primary/30">
          <div className="text-xs text-muted-foreground">Selisih</div>
          <div className="font-bold text-primary">{formatRupiah(income - expense)}</div>
        </div>
      </div>

      <div className="space-y-2">
        {txs.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              {t.type === "income" ? <ArrowUpCircle className="h-5 w-5 text-success" /> : <ArrowDownCircle className="h-5 w-5 text-destructive" />}
              <div>
                <div className="font-medium">{t.category}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  {t.description && ` · ${t.description}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`font-semibold ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                {t.type === "income" ? "+" : "-"}{formatRupiah(t.amount)}
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {txs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Belum ada transaksi.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Transaksi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Jenis</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Kategori</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Donasi / Sewa tenda / dll" /></div>
            <div><Label>Nominal (Rp)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><Label>Tanggal</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Keterangan (opsional)</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TransactionsManager;
