import { Progress } from "@/components/ui/progress";

export function ProductWizardSteps({ steps, current }: { steps: readonly string[]; current: number }) {
  const percent = ((current + 1) / steps.length) * 100;

  return (
    <div className="space-y-2">
      <Progress value={percent} />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Passo {current + 1} de {steps.length}
        </span>
        <span className="font-medium text-cc-green">{steps[current]}</span>
      </div>
    </div>
  );
}
