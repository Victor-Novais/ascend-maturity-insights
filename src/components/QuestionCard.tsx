import { cn } from "@/lib/utils";
import type { WizardQuestion } from "@/services/api";

type QuestionCardProps = {
  question: WizardQuestion;
  selectedOptionId?: number;
  disabled?: boolean;
  onSelect: (optionId: number) => void;
};

export default function QuestionCard({
  question,
  selectedOptionId,
  disabled = false,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="ascend-card space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {question.category ?? "Sem categoria"}
        </p>
        <h2 className="mt-2 text-lg sm:text-xl font-semibold">{question.text}</h2>
      </div>

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option.id)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                  : "border-border hover:border-primary/50 hover:bg-muted/30",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
