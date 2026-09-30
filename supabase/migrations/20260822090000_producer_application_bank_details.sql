-- Dados de repasse (PJ): produtor/cooperativa aprovado não tinha nenhum jeito
-- de receber pelas vendas — faltava banco/conta/PIX no cadastro inteiro.
-- Nullable no banco porque candidaturas existentes não têm o dado ainda; a
-- camada de aplicação exige o preenchimento antes de enviar para análise.

alter table public.producer_applications add column bank_name text;
alter table public.producer_applications add column bank_account_type text
  check (bank_account_type is null or bank_account_type in ('corrente', 'pagamentos'));
alter table public.producer_applications add column bank_agency text;
alter table public.producer_applications add column bank_account text;
alter table public.producer_applications add column pix_key text;
