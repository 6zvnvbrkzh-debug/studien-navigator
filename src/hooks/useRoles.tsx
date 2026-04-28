import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "premium" | "user";

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    setRoles((data ?? []).map((r: { role: AppRole }) => r.role));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isPremium = hasRole("premium") || hasRole("admin");
  const isAdmin = hasRole("admin");

  return { roles, loading, hasRole, isPremium, isAdmin, refresh };
}
