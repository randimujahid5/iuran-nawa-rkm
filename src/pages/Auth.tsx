import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { isBendahara, loading, signIn } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isBendahara) navigate("/dashboard");
  }, [isBendahara, loading, navigate]);

  const handle = async () => {
    if (!password) { toast.error("Masukkan password"); return; }
    setBusy(true);
    const ok = await signIn(password);
    setBusy(false);
    if (ok) {
      toast.success("Berhasil masuk");
      navigate("/dashboard");
    } else {
      toast.error("Password salah");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-subtle p-4">
      <Card className="w-full max-w-md p-8 shadow-card">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary shadow-glow mb-3">
            <Wallet className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Akses Bendahara</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            RKM Perumahan Nawa Residence
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Password Bendahara</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handle()}
              placeholder="Masukkan password"
              autoFocus
            />
          </div>
          <Button className="w-full" onClick={handle} disabled={busy}>
            {busy ? "Memproses..." : "Masuk"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Hubungi pengurus jika lupa password.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
