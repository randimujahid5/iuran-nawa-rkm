import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

const ChangePasswordDialog = () => {
  const { changePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (newPw.length < 6) { toast.error("Password baru minimal 6 karakter"); return; }
    if (newPw !== confirmPw) { toast.error("Konfirmasi password tidak cocok"); return; }
    setBusy(true);
    const ok = await changePassword(oldPw, newPw);
    setBusy(false);
    if (ok) {
      toast.success("Password berhasil diubah");
      setOpen(false);
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } else {
      toast.error("Password lama salah atau gagal mengubah");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <KeyRound className="h-4 w-4" /> Ganti Password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Ganti Password Bendahara</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Password Lama</Label><Input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} /></div>
          <div><Label>Password Baru</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
          <div><Label>Konfirmasi Password Baru</Label><Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy}>{busy ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
