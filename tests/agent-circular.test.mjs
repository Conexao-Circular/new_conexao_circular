import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("a jornada P0 usa o papel canônico e a feature flag", () => {
  const action = read("src/app/cadastro/actions.ts");
  const helper = read("src/lib/agent-circular.ts");
  assert.match(action, /AGENT_ROLE/);
  assert.match(action, /isAgentCircularEnabled/);
  assert.match(helper, /process\.env\.AGENT_CIRCULAR_ENABLED !== "false"/);
  assert.match(action, /\/agente\/formacao/);
});

test("o currículo P0 contém os seis módulos oficiais", () => {
  const course = read("src/lib/agent-course.ts");
  for (const title of ["Conexão Circular", "Economia Circular", "Resíduos e PNRS", "ODS e Impacto", "Avaliação de Negócios", "Missão do Agente"]) {
    assert.match(course, new RegExp(title));
  }
  assert.match(course, /AGENT_COURSE_PASSING_SCORE = 80/);
});

test("as APIs derivam o agente da sessão e não aceitam agent_id confiado", () => {
  for (const file of ["course", "dashboard", "evidences", "mission", "profile", "referrals"]) {
    const source = read(`src/app/api/agent/${file}/route.ts`);
    assert.match(source, /getAuthenticatedAgent/);
    assert.doesNotMatch(source, /body\??\.agent_id|form\.get\(["']agent_id/);
  }
});

test("evidências usam storage privado, RLS e upload limitado", () => {
  const migration = read("supabase/migrations/20260918120000_agent_circular_p0.sql");
  assert.match(migration, /'agent-evidences',[\s\S]*false/);
  assert.match(migration, /alter table public\.agent_evidences enable row level security/);
  assert.match(migration, /10485760/);
  assert.match(migration, /storage\.foldername\(name\).*auth\.uid/);
  assert.match(read("src/app/api/agent/evidences/route.ts"), /MAX_SIZE = 10 \* 1024 \* 1024/);
});

test("o progresso e as indicações ficam no backend e não em localStorage", () => {
  const source = [
    read("src/app/api/agent/course/route.ts"),
    read("src/app/api/agent/referrals/route.ts"),
    read("src/app/api/agent/evidences/route.ts"),
  ].join("\n");
  assert.match(source, /agent_course_progress/);
  assert.match(source, /agent_referrals/);
  assert.match(source, /agent_evidences/);
  assert.doesNotMatch(source, /localStorage/);
});

test("o papel é adicionado em migração própria antes do trigger", () => {
  const roleMigration = read("supabase/migrations/20260918115900_agent_circular_role.sql");
  const foundation = read("supabase/migrations/20260918120000_agent_circular_p0.sql");
  assert.match(roleMigration, /add value if not exists 'agent_circular'/);
  assert.doesNotMatch(foundation.split("create or replace function public.handle_new_user")[0], /alter type public\.user_role/);
  assert.match(foundation, /create or replace function public\.handle_new_user/);
});

test("o fluxo de auth preserva o destino e trata callbacks PKCE", () => {
  const loginAction = read("src/app/login/actions.ts");
  const signupAction = read("src/app/cadastro/actions.ts");
  const confirmationRoute = read("src/app/auth/confirm/route.ts");
  const middleware = read("src/lib/supabase/middleware.ts");

  assert.match(loginAction, /getLoginFailure/);
  assert.match(loginAction, /getSafeNextPath/);
  assert.match(signupAction, /identities\.length === 0/);
  assert.match(confirmationRoute, /exchangeCodeForSession/);
  assert.match(confirmationRoute, /verifyOtp/);
  assert.match(middleware, /returnTo/);
});
