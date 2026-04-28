import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";
import { useTransactions } from "@/hooks/useTransactions";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Sparkles, Target, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { transactions, refresh } = useTransactions();
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<Array<{ id: string; title: string; due_date: string }>>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bafoeg_deadlines")
      .select("id,title,due_date")
      .eq("user_id", user.id)
      .gte("due_date", new Date().toISOString().slice(0, 10))
      .order("due_date")
      .limit(3)
      .then(({ data }) => setDeadlines(data ?? []));
  }, [user]);

  const monthData = useMemo(() => {
    const now = new Date();
    const ym = now.toISOString().slice(0, 7);
    const monthTx = transactions.filter((t) => t.occurred_on.startsWith(ym));
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const byCat: Record<string, number> = {};
    monthTx.filter((t) => t.type === "expense").forEach((t) => {
      byCat[t.category] = (byCat[t.category] ?? 0) + Number(t.amount);
    });
    return { income, expenses, byCat, count: monthTx.length };
  }, [transactions]);

  const budget = Number(profile?.monthly_budget ?? 0);
  const remaining = budget - monthData.expenses;
  const savingsGoal = Number(profile?.savings_goal ?? 0);
  const saved = Math.max(0, monthData.income - monthData.expenses);
  const savingsPct = savingsGoal > 0 ? Math.min(100, Math.round((saved / savingsGoal) * 100)) : 0;

  const insights = useMemo(() => {
    const out: string[] = [];
    if (monthData.count === 0) {
      out.push(t("insights.noData"));
      return out;
    }
    if (budget > 0) {
      if (remaining >= 0) out.push(t("insights.onTrack", { amount: remaining.toFixed(0) }));
      else out.push(t("insights.overBudget", { amount: Math.abs(remaining).toFixed(0) }));
    }
    if (monthData.expenses > 0) {
      const food = monthData.byCat.food ?? 0;
      const foodPct = Math.round((food / monthData.expenses) * 100);
      if (foodPct >= 25) out.push(t("insights.foodHigh", { percent: foodPct }));
      const rent = monthData.byCat.rent ?? 0;
      const rentPct = Math.round((rent / monthData.expenses) * 100);
      if (rentPct >= 35) out.push(t("insights.rentHigh", { percent: rentPct }));
    }
    if (savingsGoal > 0 && saved > 0) {
      out.push(t("insights.savingsProgress", { percent: savingsPct }));
    }
    return out.slice(0, 3);
  }, [monthData, budget, remaining, t, savingsGoal, saved, savingsPct]);

  // Streak: distinct days with a transaction in the last 7 days
  const streak = useMemo(() => {
    const days = new Set(transactions.map((t) => t.occurred_on));
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (days.has(d.toISOString().slice(0, 10))) s++;
      else break;
    }
    return s;
  }, [transactions]);

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {profile?.display_name ? `${t("dashboard.greeting")}, ${profile.display_name} 👋` : t("dashboard.greetingNoName")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
        </div>
        <div className="hidden sm:block">
          <AddTransactionDialog onSaved={refresh} />
        </div>
      </div>

      {/* Budget summary */}
      <Card className="p-6 bg-[var(--gradient-primary)] text-primary-foreground border-0">
        <div className="text-sm opacity-90">{t("dashboard.remaining")}</div>
        <div className="text-4xl font-bold mt-1">€ {remaining.toFixed(2)}</div>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${budget > 0 ? Math.min(100, (monthData.expenses / budget) * 100) : 0}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs opacity-90">
          <span>{t("dashboard.spent")}: € {monthData.expenses.toFixed(2)}</span>
          <span>{t("dashboard.monthlyBudget")}: € {budget.toFixed(2)}</span>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <TrendingUp className="w-4 h-4 text-success" /> {t("dashboard.income")}
          </div>
          <div className="text-xl font-bold mt-1">€ {monthData.income.toFixed(0)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <TrendingDown className="w-4 h-4 text-accent" /> {t("dashboard.expenses")}
          </div>
          <div className="text-xl font-bold mt-1">€ {monthData.expenses.toFixed(0)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Target className="w-4 h-4 text-primary" /> {t("dashboard.savingsGoal")}
          </div>
          <div className="text-xl font-bold mt-1">{savingsPct}%</div>
          <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${savingsPct}%` }} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Flame className="w-4 h-4 text-warning" /> {t("dashboard.streak")}
          </div>
          <div className="text-xl font-bold mt-1">{streak} <span className="text-sm font-normal text-muted-foreground">{t("dashboard.days")}</span></div>
        </Card>
      </div>

      {/* Insights */}
      <Card className="p-6">
        <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />{t("dashboard.insights")}</h2>
        <ul className="mt-3 space-y-2">
          {insights.map((ins, i) => (
            <li key={i} className="text-sm text-foreground/80 p-3 bg-secondary rounded-lg">{ins}</li>
          ))}
        </ul>
      </Card>

      {/* Deadlines */}
      <Card className="p-6">
        <h2 className="font-semibold">{t("dashboard.upcomingDeadlines")}</h2>
        {deadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-3">{t("dashboard.noDeadlines")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {deadlines.map((d) => (
              <li key={d.id} className="flex justify-between p-3 bg-secondary rounded-lg text-sm">
                <span className="font-medium">{d.title}</span>
                <span className="text-muted-foreground">{new Date(d.due_date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Mobile FAB */}
      <div className="sm:hidden fixed bottom-20 right-4 z-20">
        <AddTransactionDialog onSaved={refresh} />
      </div>
    </div>
  );
}