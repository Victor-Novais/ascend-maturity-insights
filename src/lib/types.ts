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

export interface AssessmentEvidenceFile {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export type AssessmentStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SUBMITTED";
export type MaturityLevel = "ARTESANAL" | "EFICIENTE" | "EFICAZ" | "ESTRATEGICO";

export interface Assessment {
  id: number;
  companyId: number;
  company?: Pick<Company, "id" | "name" | "segment">;
  status: AssessmentStatus;
  totalScore?: string | null;
  maturityLevel?: MaturityLevel | null;
  categoryScores?: Record<QuestionCategory, number>;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResponse {
  id: number;
  assessmentId: number;
  questionId: number;
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
  };
  evidenceFiles: AssessmentEvidenceFile[];
}

export interface AssessmentWithRelations extends Assessment {
  responses: AssessmentResponse[];
}

export interface CreateAssessmentRequest {
  companyId: number;
}

export interface EvidenceFileInput {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface AssessmentResponseItemInput {
  questionId: number;
  responseValue: string;
  evidence?: string;
  evidenceFileUrl?: string;
  observation?: string;
  evidenceFiles?: EvidenceFileInput[];
}

export interface UpsertAssessmentResponsesRequest {
  assessmentId?: number;
  responses: AssessmentResponseItemInput[];
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

export interface Report {
  id: number;
  assessmentId: number;
  totalScore: string;
  maturityLevel: MaturityLevel;
  categoryScores: Record<QuestionCategory, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  generatedAt: string;
  payload: ReportPayload;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
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
