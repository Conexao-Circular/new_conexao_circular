import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedAgent } from "@/lib/agent-auth";
import { recordAgentEvent } from "@/lib/agent-analytics";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "audio/mpeg", "application/pdf"]);
const MAX_SIZE = 10 * 1024 * 1024;

export async function GET() {
  const agent = await getAuthenticatedAgent();
  if (!agent) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { data, error } = await agent.supabase.from("agent_evidences").select("*").eq("agent_id", agent.user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível carregar as evidências." }, { status: 500 });
  const evidences = await Promise.all((data ?? []).map(async (item) => {
    const { data: signed } = await agent.supabase.storage.from("agent-evidences").createSignedUrl(item.file_path, 600);
    return { ...item, signed_url: signed?.signedUrl ?? null };
  }));
  return NextResponse.json({ evidences });
}

export async function POST(request: Request) {
  const agent = await getAuthenticatedAgent();
  if (!agent) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Envie um arquivo de evidência." }, { status: 400 });
  if (file.size > MAX_SIZE || !ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Arquivo inválido. Use imagem, vídeo, áudio ou PDF de até 10 MB." }, { status: 400 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
  const path = `${agent.user.id}/${randomUUID()}-${safeName}`;
  const { error: uploadError } = await agent.supabase.storage.from("agent-evidences").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "Não foi possível enviar o arquivo." }, { status: 500 });

  const { data, error } = await agent.supabase.from("agent_evidences").insert({
    agent_id: agent.user.id,
    file_path: path,
    object_key: path,
    file_name: file.name.slice(0, 240),
    content_type: file.type,
    evidence_type: file.type.startsWith("image/") ? "photo" : "document",
    title: String(form.get("title") ?? "Evidência da missão").slice(0, 160),
    description: String(form.get("observation") ?? "").slice(0, 1000) || null,
    observation: String(form.get("observation") ?? "").slice(0, 1000) || null,
    status: "under_review",
  }).select().single();
  if (error) {
    await agent.supabase.storage.from("agent-evidences").remove([path]);
    return NextResponse.json({ error: "Arquivo enviado, mas não foi possível registrar a evidência." }, { status: 500 });
  }
  await recordAgentEvent(agent.supabase, agent.user.id, "evidence_uploaded", { content_type: file.type });
  return NextResponse.json({ evidence: data }, { status: 201 });
}
