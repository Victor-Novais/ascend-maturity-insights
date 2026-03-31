import { useNavigate } from "react-router-dom";
import AssessmentWizard from "@/components/AssessmentWizard";

export default function AssessmentCreatePage() {
  const navigate = useNavigate();

  return (
    <AssessmentWizard
      onCreated={(assessmentId) => {
        navigate(`/assessment/${assessmentId}`);
      }}
    />
  );
}
