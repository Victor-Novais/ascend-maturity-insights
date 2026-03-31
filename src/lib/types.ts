export type UserRole = "ADMIN" | "CLIENTE" | "COLLABORATOR";

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type CompanySize = "MICRO" | "PEQUENA" | "MEDIA" | "GRANDE";

export interface Company {
  id: number;
  companyCode?: string;
  name: string;
  segment: string;
  size: CompanySize | null;
  responsible: string;
  responsibleEmail: string;
  responsiblePhone: string | null;
  cnpj: string | null;
  address: string | null;
  createdById: string | null;
  createdAt: string;
}

export interface CompanyAssignment {
  id: number;
  userId: string;
  companyId: number;
  createdAt: string;
  user: Pick<User, "id" | "name" | "email" | "role">;
}

export interface CompanyWithRelations extends Company {
  createdBy: Pick<User, "id" | "name" | "email" | "role"> | null;
  assignments: CompanyAssignment[];
  _count: {
    assessments: number;
  };
}

export type QuestionCategory = "GOVERNANCA" | "SEGURANCA" | "PROCESSOS" | "INFRAESTRUTURA" | "CULTURA";
export type ResponseType = "YES_NO" | "SCALE";

/** Legacy global question bank (ADMIN-managed). */
export interface Question {
  id: number;
  version: number;
  text: string;
  category: QuestionCategory;
  weight: string;
  responseType: ResponseType;
  evidenceRequired: boolean;
  hint?: string;
  isActive: boolean;
  createdBy: Pick<User, "id" | "name" | "email" | "role">;
}

export interface QuestionTemplateOption {
  id: number;
  label: string;
  scoreValue: string;
  sortOrder: number;
}

export interface AssessmentQuestionOption {
  id: number;
  text: string;
  weight: number;
}

export interface AssessmentQuestion {
  id: number;
  text: string;
  category: QuestionCategory | string | null;
  options: AssessmentQuestionOption[];
}

/** Question inside a global questionnaire template (backend QuestionTemplate). */
export interface QuestionTemplate {
  id: number;
  text: string;
  category: QuestionCategory;
  weight: string;
  /** Backend may provide explicit question type: text | multiple_choice | scale */
  type?: string | null;
  responseType: ResponseType;
  evidenceRequired: boolean;
  hint: string | null;
  sortOrder: number;
  options: QuestionTemplateOption[];
}

export interface QuestionnaireTemplateSummary {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireTemplateWithQuestions extends QuestionnaireTemplateSummary {
  questions: QuestionTemplate[];
}

export type QuestionnaireTemplateListItem = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  questionCount: number;
  categories: string[];
};

export type AssessmentAssignmentStatus = string;

export interface AssessmentAssignment {
  id: number;
  userId: string;
  status: AssessmentAssignmentStatus;
  submittedAt: string | null;
}

export interface AssessmentEvidenceFile {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export type AssessmentStatus = string;
export type MaturityLevel = "ARTESANAL" | "EFICIENTE" | "EFICAZ" | "ESTRATEGICO";

/** Persisted report row + JSON fields from backend. */
export interface AssessmentReport {
  id: number;
  assessmentId: number;
  totalScore: string;
  maturityLevel: MaturityLevel;
  categoryScores: Record<QuestionCategory, number>;
  strengths: unknown;
  weaknesses: unknown;
  recommendations: unknown;
  generatedAt: string;
}

export interface Assessment {
  id: number;
  companyId: number;
  questionnaireTemplateId: number | null;
  company?: Pick<Company, "id" | "name" | "segment">;
  questionnaireTemplate?: Pick<QuestionnaireTemplateSummary, "id" | "name" | "description"> | QuestionnaireTemplateWithQuestions | null;
  assignments?: AssessmentAssignment[];
  status: AssessmentStatus;
  totalScore?: string | null;
  maturityLevel?: MaturityLevel | null;
  report?: AssessmentReport | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResponse {
  id: number;
  assessmentId: number;
  questionId: number | null;
  questionTemplateId: number | null;
  assessmentQuestionId?: number | null;
  selectedOptionId?: number | null;
  userId: string | null;
  questionVersion: number;
  responseValue: string;
  score: string;
  evidence: string | null;
  evidenceFileUrl: string | null;
  observation: string | null;
  answeredAt: string | null;
  createdAt: string;
  question: {
    id: number;
    text: string;
    category: QuestionCategory;
    responseType: ResponseType;
  } | null;
  questionTemplate: {
    id: number;
    text: string;
    category: QuestionCategory;
    responseType: ResponseType;
    options?: QuestionTemplateOption[];
  } | null;
  evidenceFiles: AssessmentEvidenceFile[];
}

export interface AssessmentWithRelations extends Assessment {
  responses: AssessmentResponse[];
}

/** Create legacy assessment (no template) or template-driven (requires collaborators on company). */
export interface CreateAssessmentRequest {
  companyId: number;
  /** When set, backend creates assignments for all company collaborators. */
  questionnaireTemplateId: number;
}

export interface EvidenceFileInput {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface AssessmentResponseItemInput {
  questionId?: number;
  questionTemplateId?: number;
  assessmentQuestionId?: number;
  selectedOptionId?: number;
  responseValue: string;
  evidence?: string;
  evidenceFileUrl?: string;
  observation?: string;
  evidenceFiles?: EvidenceFileInput[];
}

export interface UpsertAssessmentResponsesRequest {
  responses: AssessmentResponseItemInput[];
}

export interface SubmitAnswersRequest {
  assessmentId: number;
  answers: Array<{
    assessmentQuestionId: number;
    selectedOptionId: number;
  }>;
}

export interface AssessmentResultData {
  score: number;
  maturityLevel: MaturityLevel;
  categoryScores: Record<QuestionCategory, number>;
}

export interface ReportPayload {
  assessmentId: number;
  totalScore: number;
  maturityLevel: MaturityLevel;
  categoryScores: Record<QuestionCategory, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  /** Backend enum: CLIENTE | COLLABORATOR */
  userType: "CLIENTE" | "COLLABORATOR";
  companyCode?: string;
}

export interface AuthResponse {
  accessToken: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
  };
}

export interface CreateCompanyRequest {
  name: string;
  segment: string;
  size?: CompanySize;
  responsible: string;
  responsibleEmail: string;
  responsiblePhone?: string;
  cnpj?: string;
  address?: string;
  createdById?: string;
}

export type UpdateCompanyRequest = Partial<CreateCompanyRequest>;
