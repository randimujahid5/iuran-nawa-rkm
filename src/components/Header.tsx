import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Home, LayoutDashboard, LogIn, LogOut, Wallet } from "lucide-react";

const Header = () => {
  const { isBendahara, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight min-w-0">
            <div className="font-bold text-foreground text-sm sm:text-base truncate">RKM Nawa Residence</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Laporan Iuran Real-time</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Link to="/">
            <Button variant={location.pathname === "/" ? "secondary" : "ghost"} size="sm" className="gap-2 px-2 sm:px-3">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Laporan</span>
            </Button>
          </Link>

          {isBendahara && (
            <Link to="/dashboard">
              <Button variant={location.pathname.startsWith("/dashboard") ? "secondary" : "ghost"} size="sm" className="gap-2 px-2 sm:px-3">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
          )}

          {isBendahara ? (
            <Button onClick={handleSignOut} variant="outline" size="sm" className="gap-2 px-2 sm:px-3">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="gap-2 px-2 sm:px-3">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login Bendahara</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
