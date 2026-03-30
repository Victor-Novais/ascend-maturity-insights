import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SkeletonBlock } from "@/components/ui/skeleton-card";
import { BarChart3 } from "lucide-react";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-12 h-12 rounded-xl ascend-gradient flex items-center justify-center animate-scale-in">
          <BarChart3 className="w-6 h-6 text-primary-foreground" />
        </div>
        <SkeletonBlock className="h-4 w-32" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
