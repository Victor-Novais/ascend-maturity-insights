export type UserRole = "ADMIN" | "AVALIADOR" | "CLIENTE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type CompanySize = "MICRO" | "PEQUENA" | "MEDIA" | "GRANDE";

export interface Company {
  id: number;
  name: string;
  segment: string;
  size: CompanySize;
  responsible: string;
  responsibleEmail: string;
  responsiblePhone: string;
  cnpj: string;
  address: string;
  createdById: string;
  createdAt?: string;
}

export type QuestionCategory = "GOVERNANCA" | "SEGURANCA" | "PROCESSOS" | "INFRAESTRUTURA" | "CULTURA";
export type ResponseType = "YES_NO" | "SCALE";

export interface Question {
  id: number;
  version: number;
  text: string;
  category: QuestionCategory;
  weight: number;
  responseType: ResponseType;
  evidenceRequired: boolean;
  hint?: string;
  isActive: boolean;
}

export type AssessmentStatus = "IN_PROGRESS" | "COMPLETED";
export type MaturityLevel = "ARTESANAL" | "EFICIENTE" | "EFICAZ" | "ESTRATEGICO";

export interface Assessment {
  id: number;
  companyId: number;
  company?: Company;
  status: AssessmentStatus;
  totalScore?: number;
  maturityLevel?: MaturityLevel;
  startedAt: string;
  completedAt?: string;
}

export interface AssessmentResponse {
  id: number;
  assessmentId: number;
  questionId: number;
  value: string;
  comments?: string;
}

export interface EvidenceFile {
  id: number;
  responseId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface CategoryScore {
  category: QuestionCategory;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface Report {
  id: number;
  assessmentId: number;
  totalScore: number;
  maturityLevel: MaturityLevel;
  categoryScores: CategoryScore[];
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
}

export interface AuthResponse {
  accessToken: string;
  user?: User;
}
