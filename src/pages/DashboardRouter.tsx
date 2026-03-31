import { useAuth } from "@/contexts/AuthContext";
import DashboardAnalyticsPage from "@/pages/dashboard";
import CollaboratorDashboard from "@/pages/CollaboratorDashboard";

export default function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === "COLLABORATOR") {
    return <CollaboratorDashboard />;
  }

  return <DashboardAnalyticsPage />;
}
