import { Badge } from "@/components/ui/badge";
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
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Badge className={frameworkBadgeClasses[type]}>{frameworkShortLabels[type]}</Badge>
      {frameworkRef ? <span className="text-xs font-medium text-muted-foreground">{frameworkRef}</span> : null}
    </div>
  );

  if (!frameworkNote?.trim()) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>{badge}</div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm">
        {frameworkNote}
      </TooltipContent>
    </Tooltip>
  );
}
