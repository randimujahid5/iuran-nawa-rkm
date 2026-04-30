import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { formatPeriod, formatRupiah, monthNames, periodKey } from "@/lib/format";

interface Due { id: string; period: string; amount: number; notes: string | null; }

const DuesManager = () => {
  const [dues, setDues] = useState<Due[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Due | null>(null);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { data } = await supabase.from("monthly_dues").select("*").order("period", { ascending: false });
    setDues((data as any) || []);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setYear(now.getFullYear()); setMonth(now.getMonth());
    setAmount(""); setNotes("");
    setOpen(true);
  };

  const openEdit = (d: Due) => {
    setEditing(d);
    const dt = new Date(d.period);
    setYear(dt.getFullYear()); setMonth(dt.getMonth());
    setAmount(String(d.amount)); setNotes(d.notes || "");
    setOpen(true);
  };

  const save = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error("Nominal harus lebih dari 0"); return; }
    const payload = { period: periodKey(year, month), amount: num, notes: notes || null };
    const { error } = editing
      ? await supabase.from("monthly_dues").update(payload).eq("id", editing.id)
      : await supabase.from("monthly_dues").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Iuran disimpan");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus iuran periode ini?")) return;
    const { error } = await supabase.from("monthly_dues").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Dihapus"); load();
  };

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Iuran Bulanan</h3>
          <p className="text-sm text-muted-foreground">Atur nominal iuran tiap periode</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Tambah</Button>
      </div>

      <div className="space-y-2">
        {dues.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <div className="font-medium">{formatPeriod(d.period)}</div>
              {d.notes && <div className="text-xs text-muted-foreground">{d.notes}</div>}
            </div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-primary">{formatRupiah(d.amount)}</div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {dues.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Belum ada iuran. Tambahkan iuran bulan ini.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Iuran" : "Tambah Iuran"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Bulan</Label>
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tahun</Label>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Nominal (Rp)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" /></div>
            <div><Label>Catatan (opsional)</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DuesManager;
