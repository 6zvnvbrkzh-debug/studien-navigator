import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTransactions } from "@/hooks/useTransactions";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { CATEGORY_COLORS } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Budget() {
  const { t } = useTranslation();
  const { transactions, refresh } = useTransactions();

  const ym = new Date().toISOString().slice(0, 7);
  const monthTx = transactions.filter((tx) => tx.occurred_on.startsWith(ym));

  const distribution = useMemo(() => {
    const map: Record<string, number> = {};
    monthTx.filter((tx) => tx.type === "expense").forEach((tx) => {
      map[tx.category] = (map[tx.category] ?? 0) + Number(tx.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] ?? "#999" }));
  }, [monthTx]);

  const trend = useMemo(() => {
    const days: Record<string, number> = {};
    monthTx.filter((tx) => tx.type === "expense").forEach((tx) => {
      const d = tx.occurred_on.slice(8, 10);
      days[d] = (days[d] ?? 0) + Number(tx.amount);
    });
    return Object.entries(days)
      .sort()
      .map(([day, amount]) => ({ day, amount }));
  }, [monthTx]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(t("budget.deleted"));
      refresh();
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("budget.title")}</h1>
        <AddTransactionDialog onSaved={refresh} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">{t("budget.distribution")}</h2>
          {distribution.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">{t("budget.noTransactions")}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {distribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `€ ${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {distribution.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {distribution.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span>{t(`categories.${d.name}`)}</span>
                  <span className="ml-auto text-muted-foreground">€ {d.value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">{t("budget.overview")}</h2>
          {trend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">{t("budget.noTransactions")}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <XAxis dataKey="day" fontSize={11} />
                  <Tooltip formatter={(v: number) => `€ ${v.toFixed(2)}`} />
                  <Bar dataKey="amount" fill="hsl(217 91% 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">{t("budget.recent")}</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t("budget.noTransactions")}</p>
        ) : (
          <ul className="divide-y">
            {transactions.slice(0, 30).map((tx) => (
              <li key={tx.id} className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: (CATEGORY_COLORS[tx.category] ?? "#999") + "22", color: CATEGORY_COLORS[tx.category] ?? "#999" }}>
                  <span className="text-xs font-bold">{t(`categories.${tx.category}`).charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{t(`categories.${tx.category}`)}{tx.note ? ` · ${tx.note}` : ""}</div>
                  <div className="text-xs text-muted-foreground">{new Date(tx.occurred_on).toLocaleDateString()}</div>
                </div>
                <div className={`font-semibold text-sm ${tx.type === "income" ? "text-success" : "text-foreground"}`}>
                  {tx.type === "income" ? "+" : "−"} € {Number(tx.amount).toFixed(2)}
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(tx.id)} aria-label={t("budget.delete")}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}