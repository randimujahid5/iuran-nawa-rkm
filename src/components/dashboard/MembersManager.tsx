import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { z } from "zod";

interface Member { id: string; name: string; block: string | null; phone: string | null; active: boolean; }

const schema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  block: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(30).optional(),
});

const MembersManager = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: "", block: "", phone: "", active: true });

  const load = async () => {
    const { data } = await supabase.from("members").select("*").order("name");
    setMembers((data as any) || []);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", block: "", phone: "", active: true });
    setOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({ name: m.name, block: m.block || "", phone: m.phone || "", active: m.active });
    setOpen(true);
  };

  const save = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    const payload = {
      name: parsed.data.name,
      block: form.block || null,
      phone: form.phone || null,
      active: form.active,
    };
    const { error } = editing
      ? await supabase.from("members").update(payload).eq("id", editing.id)
      : await supabase.from("members").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Peserta diperbarui" : "Peserta ditambahkan");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus peserta ini? Semua riwayat pembayarannya akan ikut terhapus.")) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Peserta dihapus");
    load();
  };

  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><UserPlus className="h-5 w-5" /> Daftar Peserta ({members.length})</h3>
          <p className="text-sm text-muted-foreground">Kelola data peserta RKM</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Tambah</Button>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <div className="font-medium flex items-center gap-2">
                {m.name}
                {!m.active && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Nonaktif</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {m.block && <>Blok {m.block}</>} {m.phone && <>· {m.phone}</>}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {members.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Belum ada peserta. Tambahkan peserta pertama.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Peserta" : "Tambah Peserta"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Blok / Alamat</Label><Input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} placeholder="A1 / B2 ..." /></div>
            <div><Label>No. Telepon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="flex items-center justify-between">
              <Label>Status Aktif</Label>
              <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MembersManager;
