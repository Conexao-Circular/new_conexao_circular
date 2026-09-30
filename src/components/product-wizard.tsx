"use client";

import { useRef, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductPhotoInput } from "@/components/product-photo-input";
import { ProductWizardSteps } from "@/components/product-wizard-steps";
import { MaterialOriginFields } from "@/components/material-origin-fields";
import { ProductPreviewCard, readProductPreview, EMPTY_PRODUCT_PREVIEW } from "@/components/product-preview-card";
import { UNIT_OPTIONS } from "@/lib/catalog";
import { MAX_POINTS_PER_BRL } from "@/lib/points";
import { createProduct } from "@/app/(app)/loja/produtos/actions";
import { PRODUCT_CATEGORY_SUGGESTIONS } from "@/app/(app)/loja/produtos/category-suggestions";

const STEPS = ["Básico", "Origem e material", "Preço e estoque", "Fotos", "Revisão"] as const;

export function ProductWizard({ userId }: { userId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [preview, setPreview] = useState(EMPTY_PRODUCT_PREVIEW);

  function syncPreview() {
    if (formRef.current) setPreview(readProductPreview(new FormData(formRef.current)));
  }

  function goTo(next: number) {
    syncPreview();
    setStep(Math.min(Math.max(next, 0), STEPS.length - 1));
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="space-y-5">
      <ProductWizardSteps steps={STEPS} current={step} />

      <form
        ref={formRef}
        action={createProduct}
        onChange={syncPreview}
        onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          if (event.key === "Enter" && !isLastStep && target.tagName !== "TEXTAREA") {
            event.preventDefault();
            goTo(step + 1);
          }
        }}
        className="space-y-6"
      >
        <section hidden={step !== 0} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do produto</Label>
            <Input id="name" name="name" required placeholder="Ex: Mel orgânico 500g" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                syncPreview();
              }}
              name="category"
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORY_SUGGESTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category === "Outros" ? (
              <Input name="category_other" placeholder="Qual categoria?" required />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Descreva o produto, sua origem e o que torna a sua loja especial."
            />
          </div>
        </section>

        <section hidden={step !== 1} className="space-y-4">
          <MaterialOriginFields />

          <div className="space-y-2">
            <Label htmlFor="production_technique">Técnica ou processo de produção</Label>
            <Textarea
              id="production_technique"
              name="production_technique"
              rows={3}
              placeholder="Ex: Costurado à mão a partir de sobras de tecido de confecção."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sustainability_note">Por que esse produto é sustentável?</Label>
            <Textarea
              id="sustainability_note"
              name="sustainability_note"
              rows={3}
              placeholder="Específico, não genérico. Ex: cada bolsa reaproveita ~1,2kg de retalho que iria pro lixo têxtil."
            />
            <p className="text-xs text-muted-foreground">Aparece pro comprador na página do produto.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input id="tags" name="tags" placeholder="Ex: reciclado, feito à mão, vegano" />
          </div>
        </section>

        <section hidden={step !== 2} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" required placeholder="Ex: 29.90" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points_value">Pontos por unidade</Label>
              <Input id="points_value" name="points_value" type="number" step="1" min="0" placeholder="Ex: 10" />
              <p className="text-xs text-cc-green/60">
                No máximo {MAX_POINTS_PER_BRL} ponto por real do preço.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque disponível</Label>
              <Input id="stock" name="stock" type="number" step="1" min="0" required placeholder="Ex: 20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade de medida</Label>
              <Select name="unit" defaultValue="un" onValueChange={syncPreview}>
                <SelectTrigger id="unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-sm font-medium text-cc-green">Dados para envio (frete)</p>
            <p className="text-xs text-muted-foreground">
              Peso e dimensões da embalagem — usados para calcular o frete até o comprador.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="weight_grams">Peso (g)</Label>
                <Input id="weight_grams" name="weight_grams" type="number" step="1" min="0" placeholder="Ex: 500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length_cm">Comprimento (cm)</Label>
                <Input id="length_cm" name="length_cm" type="number" step="0.1" min="0" placeholder="Ex: 20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width_cm">Largura (cm)</Label>
                <Input id="width_cm" name="width_cm" type="number" step="0.1" min="0" placeholder="Ex: 15" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_cm">Altura (cm)</Label>
                <Input id="height_cm" name="height_cm" type="number" step="0.1" min="0" placeholder="Ex: 10" />
              </div>
            </div>
          </div>
        </section>

        <section hidden={step !== 3} className="space-y-2">
          <Label>Fotos do produto</Label>
          <ProductPhotoInput userId={userId} />
        </section>

        <section hidden={step !== 4}>
          <ProductPreviewCard data={preview} />
        </section>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0}>
            Voltar
          </Button>
          {isLastStep ? (
            <SubmitButton>Enviar para análise</SubmitButton>
          ) : (
            <Button type="button" onClick={() => goTo(step + 1)}>
              Próximo
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
