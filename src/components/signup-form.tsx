"use client";

import { useState } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/lib/legal";
import { APPLICANT_TYPE_OPTIONS, type ApplicantType } from "@/lib/producer-application";
import { signup } from "@/app/cadastro/actions";

const CATEGORIES = [
  {
    value: "consumidor",
    title: "Consumidor Circular",
    description: "Quero economizar, acumular pontos e descartar resíduos corretamente.",
  },
  {
    value: "produtor_circular",
    title: "Produtor Circular",
    description: "Tenho um negócio ou faço coleta de resíduos e quero fazer parte da rede.",
  },
  {
    value: "agent_circular",
    title: "Agente Circular",
    description: "Quero conectar pessoas, negócios e soluções circulares no meu território.",
  },
] as const;

type SignupCategory = (typeof CATEGORIES)[number]["value"];

export function SignupForm({ ref: refCode, initialRole, next }: { ref?: string; initialRole?: string; next?: string }) {
  const [category, setCategory] = useState<SignupCategory>(
    initialRole === "agent_circular" ? "agent_circular" : "consumidor",
  );
  const [producerKind, setProducerKind] = useState<ApplicantType>("produtor");

  const isProducerCircular = category === "produtor_circular";
  const isAgentCircular = category === "agent_circular";
  const role = isAgentCircular ? "agent_circular" : !isProducerCircular ? "consumidor" : producerKind;

  return (
    <form action={signup} className="space-y-5">
      {refCode ? <input type="hidden" name="ref" value={refCode} /> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <input type="hidden" name="role" value={role} />

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-cc-green">Eu sou</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.value}
              className="group relative flex cursor-pointer flex-col gap-1 rounded-2xl border border-border bg-background p-3 text-sm transition-colors has-[:checked]:border-cc-orange has-[:checked]:bg-cc-cream/50"
            >
              <input
                type="radio"
                checked={category === cat.value}
                onChange={() => setCategory(cat.value)}
                className="sr-only"
              />
              <span className="font-medium text-cc-green">{cat.title}</span>
              <span className="text-xs text-muted-foreground">{cat.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {isProducerCircular ? (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-cc-green">Tipo de parceiro</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {APPLICANT_TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="group relative flex cursor-pointer flex-col gap-1 rounded-2xl border border-border bg-background p-3 text-sm transition-colors has-[:checked]:border-cc-orange has-[:checked]:bg-cc-cream/50"
              >
                <input
                  type="radio"
                  checked={producerKind === option.value}
                  onChange={() => setProducerKind(option.value)}
                  className="sr-only"
                />
                <span className="font-medium text-cc-green">{option.title}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Depois de criar a conta, você preenche um cadastro completo (CNPJ, documentos, operação) para
            análise da nossa curadoria antes de acessar a plataforma como parceiro.
          </p>
        </fieldset>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">{isProducerCircular ? "Nome completo / Razão social" : "Nome completo"}</Label>
        <Input id="name" name="name" required placeholder="Seu nome" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" required placeholder="(00) 00000-0000" />
        </div>
      </div>

      {isAgentCircular ? (
        <div className="space-y-4 rounded-2xl border border-cc-sand/50 bg-cc-cream/30 p-4">
          <div>
            <p className="text-sm font-medium text-cc-green">Seu território</p>
            <p className="mt-1 text-xs text-muted-foreground">Começamos com uma coorte controlada em Niterói.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agent_neighborhood">Bairro</Label>
              <Input id="agent_neighborhood" name="agent_neighborhood" required placeholder="Ex.: Icaraí" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent_city">Cidade</Label>
              <Input id="agent_city" name="agent_city" required defaultValue="Niterói" placeholder="Sua cidade" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent_availability">Disponibilidade</Label>
            <select id="agent_availability" name="agent_availability" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="">Selecione</option>
              <option value="sim">Tenho disponibilidade semanal</option>
              <option value="parcial">Tenho disponibilidade parcial</option>
              <option value="a_combinar">A combinar</option>
            </select>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-cc-green">Áreas de interesse</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {["Negócios locais", "Cooperativas", "Compostagem e orgânicos", "Educação e mobilização"].map((interest) => (
                <label key={interest} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" name="agent_interests" value={interest} className="h-4 w-4 accent-cc-orange" />
                  {interest}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : !isProducerCircular ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de nascimento</Label>
            <Input id="birth_date" name="birth_date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal_code">CEP (opcional)</Label>
            <Input id="postal_code" name="postal_code" inputMode="numeric" maxLength={9} placeholder="00000-000" />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} placeholder="Mínimo 6 caracteres" />
      </div>

      <input type="hidden" name="terms_version" value={TERMS_VERSION} />
      <input type="hidden" name="privacy_version" value={PRIVACY_VERSION} />

      <div className="space-y-3 pt-1">
        <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            name="terms_accepted"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-cc-orange"
          />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" target="_blank" className="font-medium text-cc-orange hover:underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" target="_blank" className="font-medium text-cc-orange hover:underline">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>

        {isAgentCircular ? (
          <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="agent_rules_accepted"
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-cc-orange"
            />
            <span>Li e aceito as regras de convivência, cuidado com dados e revisão do Programa de Agentes Circulares.</span>
          </label>
        ) : null}

        <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            name="marketing_opt_in"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-cc-orange"
          />
          <span>
            Quero receber novidades e comunicação por e-mail sobre a Conexão Circular
            (opcional).
          </span>
        </label>
      </div>

      <SubmitButton className="w-full">Criar conta</SubmitButton>
    </form>
  );
}
