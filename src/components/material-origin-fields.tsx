import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MATERIAL_ORIGIN_OPTIONS } from "@/lib/catalog";

/** Reused by the create wizard and the edit page — same checkboxes + free-text "other" field. */
export function MaterialOriginFields({
  selected = [],
  other = "",
}: {
  selected?: string[];
  other?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>De onde vem o material?</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {MATERIAL_ORIGIN_OPTIONS.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-foreground/90">
            <input
              type="checkbox"
              name="material_origin"
              value={option}
              defaultChecked={selected.includes(option)}
              className="h-4 w-4 rounded border-input accent-cc-green"
            />
            {option}
          </label>
        ))}
      </div>
      <Input name="material_origin_other" placeholder="Outra origem (opcional)" defaultValue={other} />
    </div>
  );
}
