import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Wallet, GraduationCap, Briefcase, ShoppingBag, User } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";
import { cn } from "@/lib/utils";
import headerLogo from "@/assets/studinance-header.webp";
import logo from "@/assets/studinance-logo.webp";

const navItems = [
  { to: "/app", key: "dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/budget", key: "budget", icon: Wallet },
  { to: "/app/bafoeg", key: "bafoeg", icon: GraduationCap },
  { to: "/app/jobs", key: "jobs", icon: Briefcase },
  { to: "/app/marketplace", key: "marketplace", icon: ShoppingBag },
  { to: "/app/profile", key: "profile", icon: User },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const currentNav = navItems.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen bg-background flex w-full max-w-full overflow-x-hidden">
      <PaymentTestModeBanner />
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card sticky top-0 h-screen">
        <div className="p-6 border-b">
          <NavLink to="/app" className="flex items-center gap-2 hover-lift">
            <img src={headerLogo} alt="Studinance" className="h-8 w-auto" />
          </NavLink>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                      : "text-foreground hover:bg-secondary hover:translate-x-0.5"
                  )
                }
              >
                <Icon className="w-5 h-5" />
                {t(`nav.${item.key}`)}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <LanguageSwitcher />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className="lg:hidden sticky top-0 z-30 bg-card/95 backdrop-blur border-b px-4 flex items-center justify-between"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            height: "calc(3.5rem + env(safe-area-inset-top))",
          }}
        >
          <div className="flex items-center gap-2">
            <img src={logo} alt="Studinance" className="h-7 w-7 rounded-md" />
            <span className="font-semibold">{currentNav ? t(`nav.${currentNav.key}`) : t("app.name")}</span>
          </div>
          <LanguageSwitcher />
        </header>

        <main
          key={location.pathname}
          className="flex-1 lg:pb-0 animate-fade-in overflow-x-hidden"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>

        {/* Bottom nav mobile */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t z-30"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="grid grid-cols-6 h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center gap-1 text-[10px] transition-all duration-200 ease-out",
                      isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="leading-none">{t(`nav.${item.key}`)}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}