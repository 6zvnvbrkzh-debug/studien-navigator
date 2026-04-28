import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Building2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Job { id: string; title: string; company: string; city: string; hourly_wage: number | null; remote: boolean; description: string | null; apply_url: string | null; }

export default function Jobs() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium } = useProfile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [city, setCity] = useState("");
  const [remote, setRemote] = useState(false);
  const [minWage, setMinWage] = useState<string>("");

  useEffect(() => {
    supabase.from("jobs").select("*").order("created_at", { ascending: false }).then(({ data }) => setJobs((data ?? []) as Job[]));
    if (user) {
      supabase.from("applications").select("job_id").eq("user_id", user.id).then(({ data }) => {
        setApplied(new Set((data ?? []).map((r: any) => r.job_id)));
      });
    }
  }, [user]);

  const cities = useMemo(() => Array.from(new Set(jobs.map((j) => j.city))).sort(), [jobs]);

  const filtered = jobs.filter((j) => {
    if (city && j.city !== city) return false;
    if (remote && !j.remote) return false;
    if (minWage && Number(j.hourly_wage ?? 0) < Number(minWage)) return false;
    return true;
  });

  const apply = async (jobId: string) => {
    if (!user) return;
    const { error } = await supabase.from("applications").insert({ user_id: user.id, job_id: jobId });
    if (error) toast.error(error.message);
    else { setApplied(new Set([...applied, jobId])); toast.success(t("jobs.applied")); }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">{t("jobs.title")}</h1>

      {!isPremium && (
        <Card className="p-6 bg-[var(--gradient-primary)] text-primary-foreground border-0">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">{t("jobs.aiMatch")}</h3>
              <p className="text-sm opacity-90 mt-1">{t("jobs.aiMatchDesc")}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 grid sm:grid-cols-3 gap-3 items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("jobs.filterCity")}</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-10 px-3 rounded-md border bg-background text-sm">
            <option value="">{t("jobs.all")}</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("jobs.filterMinWage")} (€)</label>
          <Input type="number" min={0} step={0.5} value={minWage} onChange={(e) => setMinWage(e.target.value)} placeholder="15" />
        </div>
        <label className="flex items-center gap-2 h-10">
          <Switch checked={remote} onCheckedChange={setRemote} />
          <span className="text-sm">{t("jobs.filterRemote")}</span>
        </label>
      </Card>

      <div className="grid gap-3">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{t("jobs.noJobs")}</p>}
        {filtered.map((job) => (
          <Card key={job.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{job.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{job.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.city}</span>
                  {job.remote && <Badge variant="secondary" className="text-[10px]">{t("jobs.remote")}</Badge>}
                </div>
                {job.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold">€ {Number(job.hourly_wage ?? 0).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{t("jobs.perHour")}</div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              {applied.has(job.id) ? (
                <Button variant="outline" size="sm" disabled><CheckCircle2 className="w-4 h-4 mr-1 text-success" />{t("jobs.applied")}</Button>
              ) : (
                <Button size="sm" onClick={() => apply(job.id)}>{t("jobs.markApplied")}</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}