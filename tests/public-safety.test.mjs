import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("o snapshot público não contém arquivos operacionais internos", () => {
  for (const file of ["AGENTS.md", "CLAUDE.md", ".claude/launch.json", "scripts/import-legacy-participants.mjs"]) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file);
  }
});

test("o seed público não contém dados pessoais ou empresariais reais", () => {
  const seed = read("supabase/migrations/20260611150804_seed_plans_and_cooperative.sql");
  assert.match(seed, /Cooperativa de Demonstração/);
  assert.match(seed, /\('Cooperativa de Demonstração', null, 'both'/);
  assert.match(seed, /'Contato de demonstração', null, 'active'\)/);
});

test("a publicação no mapa exige consentimento explícito", () => {
  const migration = read("supabase/migrations/20260927210000_legacy_participant_directory.sql");
  assert.doesNotMatch(migration, /update\s+public\.partners\s+set\s+map_opt_in\s*=\s*true/i);
  assert.match(migration, /authorized publication|publication consent/i);
});

test("clientes públicos não recebem colunas privadas de partners", () => {
  const migration = read("supabase/migrations/20260930120000_public_partner_column_hardening.sql");
  assert.match(migration, /revoke all on public\.partners from anon, authenticated/i);
  assert.match(migration, /grant select \(/i);
  assert.doesNotMatch(migration, /owner_profile_id|source_record_id|public_phone|instagram_url|website_url/);
});

test("pagamento simulado exige modo demo explícito", () => {
  const payments = read("src/lib/payments.ts");
  assert.match(payments, /process\.env\.DEMO_MODE !== "true"/);
  assert.match(read(".env.example"), /DEMO_MODE=false/);
});
