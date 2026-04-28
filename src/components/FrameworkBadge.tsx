import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { frameworkBadgeClasses, frameworkShortLabels, getFrameworkType } from "@/lib/frameworks";
import type { FrameworkType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  frameworkType?: FrameworkType;
  frameworkRef?: string | null;
  frameworkNote?: string | null;
  className?: string;
  fallbackToDefault?: boolean;
};

export default function FrameworkBadge({
  frameworkType,
  frameworkRef,
  frameworkNote,
  className,
  fallbackToDefault = false,
}: Props) {
  if (!frameworkType && !frameworkRef && !fallbackToDefault) {
    return null;
  }

  const type = getFrameworkType(frameworkType);
  const badge = (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        frameworkBadgeClasses[type],
        className,
      )}
    >
      {frameworkShortLabels[type]}
      {frameworkRef ? <span className="ml-1 opacity-70">{frameworkRef}</span> : null}
    </span>
  );

  if (!frameworkNote?.trim()) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm">
        {frameworkNote}
      </TooltipContent>
    </Tooltip>
  );
}
