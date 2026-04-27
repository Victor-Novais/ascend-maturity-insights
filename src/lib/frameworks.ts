import type { FrameworkType } from "@/lib/types";

export const frameworkLabels: Record<FrameworkType, string> = {
  COBIT: "COBIT 2019",
  ITIL: "ITIL 4",
  ISO_27000: "ISO/IEC 27000",
  PROPRIO: "Modelo Proprio",
};

export const frameworkShortLabels: Record<FrameworkType, string> = {
  COBIT: "COBIT",
  ITIL: "ITIL",
  ISO_27000: "ISO 27000",
  PROPRIO: "Proprio",
};

export const frameworkColors: Record<FrameworkType, string> = {
  COBIT: "#2563EB",
  ITIL: "#16A34A",
  ISO_27000: "#EA580C",
  PROPRIO: "#6B7280",
};

export const frameworkBadgeClasses: Record<FrameworkType, string> = {
  COBIT: "border-blue-200 bg-blue-50 text-blue-700",
  ITIL: "border-green-200 bg-green-50 text-green-700",
  ISO_27000: "border-orange-200 bg-orange-50 text-orange-700",
  PROPRIO: "border-slate-200 bg-slate-100 text-slate-700",
};

export const frameworkOptions: Array<{ value: FrameworkType; label: string }> = [
  { value: "PROPRIO", label: frameworkLabels.PROPRIO },
  { value: "COBIT", label: frameworkLabels.COBIT },
  { value: "ITIL", label: frameworkLabels.ITIL },
  { value: "ISO_27000", label: frameworkLabels.ISO_27000 },
];

export const frameworkFilterOptions: Array<{ value: "ALL" | FrameworkType; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "COBIT", label: "COBIT" },
  { value: "ITIL", label: "ITIL" },
  { value: "ISO_27000", label: "ISO 27000" },
  { value: "PROPRIO", label: "Proprio" },
];

export function getFrameworkType(value: unknown): FrameworkType {
  if (value === "COBIT" || value === "ITIL" || value === "ISO_27000" || value === "PROPRIO") {
    return value;
  }
  return "PROPRIO";
}
