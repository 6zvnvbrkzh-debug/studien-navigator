import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useTranslation } from "react-i18next";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  hochschule: string | null;
  semester: number | null;
  bafoeg_status: string | null;
  language: string | null;
  monthly_budget: number | null;
  savings_goal: number | null;
  onboarding_completed: boolean | null;
  premium_until: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    setProfile(data as Profile | null);
    if (data?.language && data.language !== i18n.language) {
      i18n.changeLanguage(data.language);
    }
    setLoading(false);
  }, [user, i18n]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPremium = !!(profile?.premium_until && new Date(profile.premium_until) > new Date());

  return { profile, loading, refresh, isPremium };
}