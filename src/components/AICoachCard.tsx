import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { PremiumBadge } from "@/components/PremiumGate";
import { toast } from "sonner";

interface Props {
  summary: string;
  disabled?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;

export function AICoachCard({ summary, disabled }: Props) {
  const { t } = useTranslation();
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true);
    setResponse("");
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ summary }),
      });
      if (resp.status === 429) {
        toast.error(t("aiCoach.rateLimit"));
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error(t("aiCoach.creditsOut"));
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        toast.error(t("aiCoach.error"));
        setLoading(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantText = "";
      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantText += content;
              setResponse(assistantText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(t("aiCoach.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {t("aiCoach.title")}
            <PremiumBadge />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("aiCoach.subtitle")}</p>
        </div>
        <Button size="sm" onClick={ask} disabled={loading || disabled} className="shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("aiCoach.ask")}
        </Button>
      </div>
      {response && (
        <div className="mt-4 p-4 bg-secondary rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
          {response}
        </div>
      )}
      {!response && !loading && (
        <p className="text-xs text-muted-foreground mt-3">{t("aiCoach.hint")}</p>
      )}
    </Card>
  );
}