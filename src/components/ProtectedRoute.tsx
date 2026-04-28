import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppLayout } from "./AppLayout";

export function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile?.onboarding_completed) return <Navigate to="/onboarding" replace />;

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}