"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { DRY_MATERIAL_OPTIONS } from "@/lib/address";

const WASTE_TYPES = [
  { value: "organic", title: "Orgânico", description: "Restos de alimentos, podas e resíduos compostáveis." },
  { value: "solid", title: "Seco", description: "Papel, plástico, vidro e metal recicláveis." },
  { value: "both", title: "Ambos", description: "Orgânico e seco juntos." },
] as const;

/** Waste-type picker + the dry-material breakdown, shown only when relevant — small client island inside the otherwise server-rendered form. */
export function WasteTypeFields({ defaultValue = "organic" }: { defaultValue?: string }) {
  const [wasteType, setWasteType] = useState(defaultValue);
  const showMaterials = wasteType === "solid" || wasteType === "both";

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-cc-green">Tipo de resíduo</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {WASTE_TYPES.map((waste) => (
            <label
              key={waste.value}
              className="group relative flex cursor-pointer flex-col gap-1 rounded-2xl border border-border bg-background p-3 text-sm transition-colors has-[:checked]:border-cc-orange has-[:checked]:bg-cc-cream/50"
            >
              <input
                type="radio"
                name="waste_type"
                value={waste.value}
                checked={wasteType === waste.value}
                onChange={() => setWasteType(waste.value)}
                className="sr-only"
                required
              />
              <span className="font-medium text-cc-green">{waste.title}</span>
              <span className="text-xs text-muted-foreground">{waste.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {showMaterials ? (
        <div className="space-y-2">
          <Label>Quais materiais secos, aproximadamente? (opcional)</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {DRY_MATERIAL_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-foreground/90">
                <input type="checkbox" name="dry_materials" value={option} className="h-4 w-4 rounded border-input accent-cc-green" />
                {option}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
