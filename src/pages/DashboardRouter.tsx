import { useAuth } from "@/contexts/AuthContext";
import DashboardHome from "@/pages/DashboardHome";
import CollaboratorDashboard from "@/pages/CollaboratorDashboard";

export default function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === "COLLABORATOR") {
    return <CollaboratorDashboard />;
  }

  return <DashboardHome />;
}
