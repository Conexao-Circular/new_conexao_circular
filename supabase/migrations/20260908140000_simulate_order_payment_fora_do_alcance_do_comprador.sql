-- Correção de segurança: o comprador podia aprovar o próprio pedido sem pagar.
--
-- simulate_order_payment é o pagamento simulado de dev/preview: marca o pedido
-- como pago e aprovado, o que dispara handle_order_change e credita pontos e
-- cashback. Ela estava concedida a `authenticated` — e a concessão não sabe se
-- o ambiente tem gateway configurado. Em produção, qualquer comprador logado
-- podia chamar a RPC direto (o id do próprio pedido pendente basta) e receber a
-- mercadoria, os pontos e o cashback sem pagar nada.
--
-- Está assim desde 20260707130100, que a criou junto das RPCs de pedido.
--
-- A correção tira a função do alcance do comprador: só service_role executa, e
-- a aplicação a chama pelo cliente admin (src/lib/supabase/admin.ts) no mesmo
-- caminho em que o webhook do Asaas já faz essa transição. Quem decide se o
-- pagamento é simulado passa a ser o servidor, olhando ASAAS_API_KEY, e não uma
-- permissão de banco que vale para todo ambiente.
--
-- Consequência operacional: sem SUPABASE_SERVICE_ROLE_KEY e sem ASAAS_API_KEY
-- não há como aprovar pedido — o checkout deixa o pedido pendente e avisa. A
-- chave de service role já era necessária para as notificações push, então o
-- ambiente que funcionava inteiro continua funcionando.

-- Sem a checagem de auth.uid(): sob service_role não há usuário na sessão, e a
-- confiança agora vem de quem pode executar, não de quem está logado.
create or replace function public.simulate_order_payment(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
     set payment_status = 'paid', status = 'approved'
   where id = p_order_id and status = 'pending';
end;
$$;

revoke execute on function public.simulate_order_payment(uuid) from public, anon, authenticated;
grant execute on function public.simulate_order_payment(uuid) to service_role;

comment on function public.simulate_order_payment(uuid) is
  'Pagamento simulado de dev/preview. Só service_role executa: aprovar pedido sem cobrança nunca pode partir do comprador.';
