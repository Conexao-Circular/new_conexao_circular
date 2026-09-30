"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

function formatZip(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export type AddressDefaults = {
  zip?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  reference?: string;
};

/** CEP-first address entry: looks up ViaCEP on blur and fills street/neighborhood/city/state, all still editable. */
export function CepAddressFields({
  defaults,
  autoFill,
}: {
  defaults?: AddressDefaults;
  /** Bump `nonce` to push a fresh address (e.g. from a CNPJ lookup) into the fields, still editable after. */
  autoFill?: AddressDefaults & { nonce: number };
}) {
  const [zip, setZip] = useState(defaults?.zip ?? "");
  const [street, setStreet] = useState(defaults?.street ?? "");
  const [neighborhood, setNeighborhood] = useState(defaults?.neighborhood ?? "");
  const [city, setCity] = useState(defaults?.city ?? "");
  const [state, setState] = useState(defaults?.state ?? "");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const numberRef = useRef<HTMLInputElement>(null);
  const complementRef = useRef<HTMLInputElement>(null);
  const [appliedNonce, setAppliedNonce] = useState(autoFill?.nonce);

  // Adjusting state when a prop changes — React's documented alternative to
  // setState-in-effect (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  if (autoFill && autoFill.nonce !== appliedNonce) {
    setAppliedNonce(autoFill.nonce);
    if (autoFill.zip) setZip(formatZip(autoFill.zip));
    if (autoFill.street) setStreet(autoFill.street);
    if (autoFill.neighborhood) setNeighborhood(autoFill.neighborhood);
    if (autoFill.city) setCity(autoFill.city);
    if (autoFill.state) setState(autoFill.state);
    setNotFound(false);
  }

  // Number/complement are uncontrolled — imperative DOM writes belong in an
  // effect, not the render-time branch above.
  useEffect(() => {
    if (!autoFill) return;
    if (autoFill.number && numberRef.current) numberRef.current.value = autoFill.number;
    if (autoFill.complement && complementRef.current) complementRef.current.value = autoFill.complement;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFill?.nonce]);

  async function lookupZip() {
    const digits = zip.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setLoading(true);
    setNotFound(false);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data: ViaCepResponse = await response.json();
      if (data.erro) {
        setNotFound(true);
        return;
      }
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setState(data.uf);
    } catch {
      // Best-effort — the fields stay editable manually if the lookup fails.
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address_zip">CEP</Label>
          <div className="relative">
            <Input
              id="address_zip"
              name="address_zip"
              required
              inputMode="numeric"
              placeholder="00000-000"
              maxLength={9}
              value={zip}
              onChange={(e) => setZip(formatZip(e.target.value))}
              onBlur={lookupZip}
            />
            {loading ? (
              <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          {notFound ? <p className="text-xs text-destructive">CEP não encontrado — preencha os campos manualmente.</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_number">Número</Label>
          <Input
            ref={numberRef}
            id="address_number"
            name="address_number"
            required
            placeholder="Ex: 123"
            defaultValue={defaults?.number}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_street">Rua / Avenida</Label>
        <Input
          id="address_street"
          name="address_street"
          required
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="Preenchido automaticamente pelo CEP"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_complement">Complemento (opcional)</Label>
        <Input
          ref={complementRef}
          id="address_complement"
          name="address_complement"
          placeholder="Apto, bloco, casa..."
          defaultValue={defaults?.complement}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="address_neighborhood">Bairro</Label>
          <Input
            id="address_neighborhood"
            name="address_neighborhood"
            required
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_state">UF</Label>
          <Input
            id="address_state"
            name="address_state"
            required
            maxLength={2}
            className="uppercase"
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase())}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_city">Cidade</Label>
        <Input id="address_city" name="address_city" required value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_reference">Ponto de referência (opcional)</Label>
        <Input
          id="address_reference"
          name="address_reference"
          placeholder="Ex: perto do mercado, portão azul"
          defaultValue={defaults?.reference}
        />
      </div>
    </div>
  );
}
