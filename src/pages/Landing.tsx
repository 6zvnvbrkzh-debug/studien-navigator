import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Wallet, GraduationCap, Briefcase, ArrowRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import headerLogo from "@/assets/studinance-header.webp";
import logo from "@/assets/studinance-logo.webp";

export default function Landing() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 sm:px-8 h-16 flex items-center justify-between border-b">
        <Link to="/" className="flex items-center gap-2 hover-lift">
          <img src={headerLogo} alt="Studinance" className="h-8 sm:h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild variant="ghost" size="sm"><Link to="/auth">{t("landing.login")}</Link></Button>
        </div>
      </header>

      <main className="px-4 sm:px-8">
        <section className="max-w-3xl mx-auto text-center py-16 sm:py-24 animate-fade-in">
          <img src={logo} alt="" aria-hidden="true" className="mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-8 animate-float drop-shadow-xl" />
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            {t("landing.hero")}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">{t("landing.sub")}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg" className="shadow-[var(--shadow-elevated)] hover-lift">
              <Link to="/auth?mode=signup">
                {t("landing.cta")} <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4 pb-24">
          {[
            { icon: Wallet, title: t("landing.feature1Title"), desc: t("landing.feature1Desc") },
            { icon: GraduationCap, title: t("landing.feature2Title"), desc: t("landing.feature2Desc") },
            { icon: Briefcase, title: t("landing.feature3Title"), desc: t("landing.feature3Desc") },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 bg-card border rounded-2xl card-smooth animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}