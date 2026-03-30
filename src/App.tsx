import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import DashboardRouter from "@/pages/DashboardRouter";
import CompaniesPage from "@/pages/Companies";
import CompanyForm from "@/pages/CompanyForm";
import CompanyDetail from "@/pages/CompanyDetail";
import AssessmentsPage from "@/pages/Assessments";
import AssessmentStepper from "@/pages/AssessmentStepper";
import ReportsPage from "@/pages/Reports";
import ReportPage from "@/pages/Report";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardHome />} />
                <Route path="/dashboard/companies" element={<CompaniesPage />} />
                <Route path="/dashboard/companies/new" element={<CompanyForm />} />
                <Route path="/dashboard/companies/:id" element={<CompanyDetail />} />
                <Route path="/dashboard/companies/:id/edit" element={<CompanyForm />} />
                <Route path="/dashboard/assessments" element={<AssessmentsPage />} />
                <Route path="/dashboard/assessments/:id" element={<AssessmentStepper />} />
                <Route path="/dashboard/reports" element={<ReportsPage />} />
                <Route path="/dashboard/reports/:id" element={<ReportPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
