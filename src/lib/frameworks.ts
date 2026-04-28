import { FRAMEWORK_COLORS, FRAMEWORK_LABELS, type FrameworkType } from "@/lib/types";

export const frameworkLabels = FRAMEWORK_LABELS;

export const frameworkShortLabels: Record<FrameworkType, string> = {
  COBIT: "COBIT",
  ITIL: "ITIL",
  ISO_27000: "ISO 27000",
  PROPRIO: "Próprio",
};

export const frameworkColors: Record<FrameworkType, string> = {
  COBIT: "#2563EB",
  ITIL: "#16A34A",
  ISO_27000: "#EA580C",
  PROPRIO: "#6B7280",
};

export const frameworkBadgeClasses = FRAMEWORK_COLORS;

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
  { value: "PROPRIO", label: "Próprio" },
];

export function getFrameworkType(value: unknown): FrameworkType {
  if (value === "COBIT" || value === "ITIL" || value === "ISO_27000" || value === "PROPRIO") {
    return value;
  }
  return "PROPRIO";
}
