import { cn } from "@/lib/utils";

type Props = {
  password: string;
};

function getStrength(password: string) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[@$!%*?&#]/.test(password),
  ];

  return checks.filter(Boolean).length;
}

const labels = ["Fraca", "Razoável", "Boa", "Forte"];
const tones = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

export default function PasswordStrengthIndicator({ password }: Props) {
  const strength = getStrength(password);
  const index = Math.max(0, Math.min(3, strength - 1));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, segmentIndex) => (
          <div
            key={segmentIndex}
            className={cn(
              "h-2 rounded-full bg-muted transition-colors",
              password && segmentIndex < strength && tones[index],
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Forca da senha: <span className="font-medium text-foreground">{password ? labels[index] : "Fraca"}</span>
      </p>
    </div>
  );
}
