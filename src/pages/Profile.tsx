import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LogOut, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { profile, refresh, isPremium } = useProfile();
  const [params, setParams] = useSearchParams();

  const [name, setName] = useState("");
  const [hochschule, setHochschule] = useState("");
  const [semester, setSemester] = useState<string>("");
  const [bafoeg, setBafoeg] = useState("unbekannt");
  const [budget, setBudget] = useState<string>("");
  const [savings, setSavings] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setHochschule(profile.hochschule ?? "");
      setSemester(profile.semester?.toString() ?? "");
      setBafoeg(profile.bafoeg_status ?? "unbekannt");
      setBudget(profile.monthly_budget?.toString() ?? "");
      setSavings(profile.savings_goal?.toString() ?? "");
    }
  }, [profile]);

  // Handle returning from Stripe
  useEffect(() => {
    if (params.get("checkout") === "success") {
      toast.success(t("profile.premiumActive"));
      setParams({});
      // Re-check subscription
      supabase.functions.invoke("check-subscription").then(() => refresh());
    }
  }, [params]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      display_name: name || null,
      hochschule: hochschule || null,
      semester: semester ? Number(semester) : null,
      bafoeg_status: bafoeg,
      monthly_budget: budget ? Number(budget) : 0,
      savings_goal: savings ? Number(savings) : 0,
      language: i18n.language,
    }).eq("user_id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(t("profile.saved")); refresh(); }
  };

  const upgrade = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("create-checkout");
    setBusy(false);
    if (error || !data?.url) { toast.error(error?.message || t("common.error")); return; }
    window.open(data.url, "_blank");
  };

  const portal = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("customer-portal");
    setBusy(false);
    if (error || !data?.url) { toast.error(error?.message || t("common.error")); return; }
    window.open(data.url, "_blank");
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">{t("profile.title")}</h1>

      {/* Premium card */}
      <Card className={`p-6 ${isPremium ? "" : "bg-[var(--gradient-primary)] text-primary-foreground border-0"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-semibold">{isPremium ? t("profile.premiumActive") : t("profile.upgradeToPro")}</h2>
              {isPremium && <Badge variant="secondary">{t("profile.premium")}</Badge>}
            </div>
            <p className={`text-sm mt-1 ${isPremium ? "text-muted-foreground" : "opacity-90"}`}>{t("profile.premiumDesc")}</p>
            {!isPremium && (
              <ul className="mt-4 space-y-1.5 text-sm">
                {Object.values(t("profile.upgradeBenefits", { returnObjects: true }) as Record<string, string>).map((b) => (
                  <li key={b} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {b}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="text-right shrink-0">
            {!isPremium && <div className="text-sm opacity-90 mb-2">{t("profile.pricePerMonth")}</div>}
            {isPremium ? (
              <Button variant="outline" size="sm" onClick={portal} disabled={busy}>{t("profile.manageSub")}</Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={upgrade} disabled={busy}>{t("profile.upgradeToPro")}</Button>
            )}
          </div>
        </div>
      </Card>

      {/* Profile form */}
      <Card className="p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("profile.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.hochschule")}</Label>
            <Input value={hochschule} onChange={(e) => setHochschule(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.semester")}</Label>
            <Input type="number" min={1} max={20} value={semester} onChange={(e) => setSemester(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.bafoegStatus")}</Label>
            <Select value={bafoeg} onValueChange={setBafoeg}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">{t("onboarding.bafoegYes")}</SelectItem>
                <SelectItem value="beantragt">{t("onboarding.bafoegApplied")}</SelectItem>
                <SelectItem value="nein">{t("onboarding.bafoegNo")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("profile.monthlyBudget")} (€)</Label>
            <Input type="number" min={0} step={10} value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.savingsGoal")} (€)</Label>
            <Input type="number" min={0} step={10} value={savings} onChange={(e) => setSavings(e.target.value)} />
          </div>
        </div>
        <Button onClick={save} disabled={busy}>{t("profile.save")}</Button>
      </Card>

      <Card className="p-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{user?.email}</div>
        <Button variant="ghost" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />{t("auth.signout")}</Button>
      </Card>
    </div>
  );
}