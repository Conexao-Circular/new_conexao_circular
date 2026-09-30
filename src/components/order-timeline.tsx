import { Check } from "lucide-react";

export type ShipmentTimelineStatus = "preparing" | "collected" | "shipped" | "delivered" | "canceled";

const STEPS: { key: ShipmentTimelineStatus; label: string }[] = [
  { key: "preparing", label: "Preparando" },
  { key: "collected", label: "Coletado" },
  { key: "shipped", label: "Em transporte" },
  { key: "delivered", label: "Entregue" },
];

const STEP_ORDER: Record<string, number> = { preparing: 0, collected: 1, shipped: 2, delivered: 3 };

function formatStepDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * 5-stage buyer-facing order timeline: "Confirmado" (implicit — a shipment
 * only exists once the order is approved) plus the 4 real shipment_status
 * transitions.
 */
export function OrderTimeline({
  status,
  confirmedAt,
  collectedAt,
  shippedAt,
  deliveredAt,
}: {
  status: string;
  confirmedAt: string | null;
  collectedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}) {
  if (status === "canceled") {
    return <p className="text-sm text-destructive">Esta entrega foi cancelada.</p>;
  }

  const currentIndex = STEP_ORDER[status] ?? 0;
  const timestamps: Record<string, string | null> = {
    preparing: confirmedAt,
    collected: collectedAt,
    shipped: shippedAt,
    delivered: deliveredAt,
  };

  return (
    <ol className="space-y-0">
      <li className="relative flex gap-3 pb-4">
        <span className="absolute left-[11px] top-6 h-full w-px bg-cc-green" aria-hidden="true" />
        <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cc-green text-white">
          <Check className="h-3.5 w-3.5" />
        </span>
        <div className="pt-0.5">
          <p className="text-sm font-medium text-cc-green">Confirmado</p>
          {formatStepDate(confirmedAt) ? (
            <p className="text-xs text-muted-foreground">{formatStepDate(confirmedAt)}</p>
          ) : null}
        </div>
      </li>
      {STEPS.map((step, index) => {
        const done = index < currentIndex || (index === currentIndex && step.key === "delivered");
        const isCurrent = index === currentIndex && step.key !== "delivered";
        const isLast = index === STEPS.length - 1;

        return (
          <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast ? (
              <span
                className={`absolute left-[11px] top-6 h-full w-px ${done ? "bg-cc-green" : "bg-border"}`}
                aria-hidden="true"
              />
            ) : null}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                done
                  ? "bg-cc-green text-white"
                  : isCurrent
                    ? "border-2 border-cc-orange bg-cc-cream/60 text-cc-orange"
                    : "border border-border bg-background text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </span>
            <div className="pt-0.5">
              <p className={`text-sm font-medium ${done || isCurrent ? "text-cc-green" : "text-muted-foreground"}`}>
                {step.label}
              </p>
              {formatStepDate(timestamps[step.key]) ? (
                <p className="text-xs text-muted-foreground">{formatStepDate(timestamps[step.key])}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
