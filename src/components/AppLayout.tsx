import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Wallet, GraduationCap, Briefcase, ShoppingBag, User } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card sticky top-0 h-screen">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">S</div>
            <span className="font-bold text-lg">{t("app.name")}</span>
          </div>
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
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
        <header className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur border-b px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">S</div>
            <span className="font-semibold">{currentNav ? t(`nav.${currentNav.key}`) : t("app.name")}</span>
          </div>
          <LanguageSwitcher />
        </header>

        <main className="flex-1 pb-20 lg:pb-0">{children}</main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t z-30">
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
                      "flex flex-col items-center justify-center gap-1 text-[10px]",
                      isActive ? "text-primary" : "text-muted-foreground"
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