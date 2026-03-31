import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export type QuestionDetailItem = {
  id: number;
  question: string;
  selectedAnswer: string;
  score: number | null;
};

export type QuestionGroup = {
  category: string;
  items: QuestionDetailItem[];
};

type Props = {
  groups: QuestionGroup[];
};

function getScoreTone(score: number | null) {
  if (score === null) return "bg-muted text-muted-foreground";
  if (score < 50) return "bg-red-100 text-red-700";
  if (score < 75) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function QuestionAccordion({ groups }: Props) {
  return (
    <Accordion type="multiple" className="w-full space-y-3">
      {groups.map((group) => (
        <AccordionItem key={group.category} value={group.category} className="rounded-2xl border px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex w-full items-center justify-between pr-3">
              <span className="font-semibold">{group.category}</span>
              <span className="text-xs text-muted-foreground">{group.items.length} perguntas</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {group.items.map((item) => (
                <div key={item.id} className="rounded-xl border bg-card p-3">
                  <p className="text-sm font-medium">{item.question}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Resposta: {item.selectedAnswer}</p>
                  <Badge className={`mt-3 ${getScoreTone(item.score)}`}>
                    Score: {item.score !== null ? item.score.toFixed(1) : "--"}
                  </Badge>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
