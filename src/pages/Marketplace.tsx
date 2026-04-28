import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export default function Marketplace() {
  const { t } = useTranslation();
  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold">{t("marketplace.title")}</h1>
      <Card className="mt-6 p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">{t("marketplace.comingSoon")}</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{t("marketplace.description")}</p>
      </Card>
    </div>
  );
}