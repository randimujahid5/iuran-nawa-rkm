import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  isBendahara: boolean;
  loading: boolean;
  signIn: (password: string) => Promise<boolean>;
  signOut: () => void;
  changePassword: (oldPw: string, newPw: string) => Promise<boolean>;
}

const STORAGE_KEY = "rkm_bendahara_token";

const Ctx = createContext<AuthCtx>({
  isBendahara: false,
  loading: true,
  signIn: async () => false,
  signOut: () => {},
  changePassword: async () => false,
});

const getStoredPw = () => {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
};

const fetchPassword = async (): Promise<string | null> => {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "bendahara_password")
    .maybeSingle();
  return (data?.value as string) ?? null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isBendahara, setIsBendahara] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = getStoredPw();
      if (stored) {
        const current = await fetchPassword();
        if (current && stored === current) setIsBendahara(true);
        else localStorage.removeItem(STORAGE_KEY);
      }
      setLoading(false);
    })();
  }, []);

  const signIn = async (password: string) => {
    const current = await fetchPassword();
    if (current && password === current) {
      localStorage.setItem(STORAGE_KEY, password);
      setIsBendahara(true);
      return true;
    }
    return false;
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsBendahara(false);
  };

  const changePassword = async (oldPw: string, newPw: string) => {
    const current = await fetchPassword();
    if (!current || oldPw !== current) return false;
    if (!newPw || newPw.length < 6) return false;
    const { error } = await supabase
      .from("app_settings")
      .update({ value: newPw, updated_at: new Date().toISOString() })
      .eq("key", "bendahara_password");
    if (error) return false;
    localStorage.setItem(STORAGE_KEY, newPw);
    return true;
  };

  return (
    <Ctx.Provider value={{ isBendahara, loading, signIn, signOut, changePassword }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
