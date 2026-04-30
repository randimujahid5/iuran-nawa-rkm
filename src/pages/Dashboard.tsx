import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MembersManager from "@/components/dashboard/MembersManager";
import DuesManager from "@/components/dashboard/DuesManager";
import PaymentsManager from "@/components/dashboard/PaymentsManager";
import TransactionsManager from "@/components/dashboard/TransactionsManager";
import ChangePasswordDialog from "@/components/dashboard/ChangePasswordDialog";
import { Download, Loader2 } from "lucide-react";
import { exportLaporan } from "@/lib/exportExcel";
import { toast } from "sonner";

const Dashboard = () => {
  const { isBendahara, loading } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isBendahara) navigate("/auth");
  }, [isBendahara, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (!isBendahara) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      const [m, d, p, t] = await Promise.all([
        supabase.from("members").select("*").order("name"),
        supabase.from("monthly_dues").select("*").order("period"),
        supabase.from("payments").select("*"),
        supabase.from("transactions").select("*").order("date"),
      ]);
      exportLaporan((m.data as any) || [], (d.data as any) || [], (p.data as any) || [], (t.data as any) || []);
      toast.success("Laporan Excel diunduh");
    } catch (e: any) {
      toast.error(e.message || "Gagal export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 sm:py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Bendahara</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Kelola peserta, iuran, pembayaran, dan kas RKM.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExport} disabled={exporting} className="gap-2 flex-1 sm:flex-initial">
              <Download className="h-4 w-4" /> {exporting ? "Mengunduh..." : "Export Excel"}
            </Button>
            <ChangePasswordDialog />
          </div>
        </div>

        <Tabs defaultValue="payments">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto h-auto">
            <TabsTrigger value="payments">Pembayaran</TabsTrigger>
            <TabsTrigger value="dues">Iuran Bulanan</TabsTrigger>
            <TabsTrigger value="members">Peserta</TabsTrigger>
            <TabsTrigger value="cashflow">Kas</TabsTrigger>
          </TabsList>
          <TabsContent value="payments" className="mt-4"><PaymentsManager /></TabsContent>
          <TabsContent value="dues" className="mt-4"><DuesManager /></TabsContent>
          <TabsContent value="members" className="mt-4"><MembersManager /></TabsContent>
          <TabsContent value="cashflow" className="mt-4"><TransactionsManager /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
