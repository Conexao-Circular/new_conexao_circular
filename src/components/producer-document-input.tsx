"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENT_TYPE_OPTIONS, type DocumentType } from "@/lib/producer-application";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB per file
const MAX_FILES = 10;

type Doc = {
  path: string;
  documentType: DocumentType;
  label: string;
  fileName: string;
  uploading: boolean;
};

export type ExistingDocument = { path: string; documentType: DocumentType; label: string; fileName: string };

/**
 * Uploads documents directly from the browser to the private `producer-documents`
 * bucket (owner-only RLS), then submits `{path, document_type, label}` per file
 * as JSON-encoded hidden inputs named `documents` — same body-size-limit
 * rationale as ProductPhotoInput, just private instead of public.
 */
export function ProducerDocumentInput({ userId, initialDocuments = [] }: { userId: string; initialDocuments?: ExistingDocument[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingType, setPendingType] = useState<DocumentType>("certificacao");
  const [pendingLabel, setPendingLabel] = useState("");
  const [docs, setDocs] = useState<Doc[]>(
    initialDocuments.map((d) => ({ ...d, uploading: false })),
  );
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (docs.length >= MAX_FILES) {
      setError(`Envie no máximo ${MAX_FILES} arquivos.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`"${file.name}" passa de 15MB.`);
      return;
    }

    const supabase = createClient();
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;

    const placeholder: Doc = {
      path,
      documentType: pendingType,
      label: pendingLabel,
      fileName: file.name,
      uploading: true,
    };
    setDocs((prev) => [...prev, placeholder]);
    setPendingLabel("");

    const { error: uploadError } = await supabase.storage
      .from("producer-documents")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });

    if (uploadError) {
      setError("Não foi possível enviar o arquivo. Tente novamente.");
      setDocs((prev) => prev.filter((d) => d !== placeholder));
      return;
    }

    setDocs((prev) => prev.map((d) => (d === placeholder ? { ...d, uploading: false } : d)));
  }

  function remove(path: string) {
    setDocs((prev) => prev.filter((d) => d.path !== path));
  }

  return (
    <div className="space-y-3">
      {docs
        .filter((d) => !d.uploading)
        .map((d) => (
          <input
            key={d.path}
            type="hidden"
            name="documents"
            value={JSON.stringify({ path: d.path, document_type: d.documentType, label: d.label, file_name: d.fileName })}
          />
        ))}

      {docs.length > 0 && (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li
              key={d.path}
              className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5 text-sm"
            >
              {d.uploading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-cc-green" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-cc-green">{d.label || d.fileName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {DOCUMENT_TYPE_OPTIONS.find((o) => o.value === d.documentType)?.label} · {d.fileName}
                </p>
              </div>
              {!d.uploading && (
                <button
                  type="button"
                  onClick={() => remove(d.path)}
                  aria-label="Remover arquivo"
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {docs.length < MAX_FILES && (
        <div className="space-y-2 rounded-xl border border-dashed border-cc-green/30 bg-cc-green/5 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={pendingType} onValueChange={(v) => setPendingType(v as DocumentType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Descrição (opcional)"
              value={pendingLabel}
              onChange={(e) => setPendingLabel(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Escolher arquivo
          </Button>
          <input ref={inputRef} type="file" accept="image/*,.pdf" onChange={handleChange} className="sr-only" />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
