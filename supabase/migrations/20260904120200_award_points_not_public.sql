-- Fecha as funções de pontuação para chamada direta pela API.
--
-- O PostgREST expõe como RPC toda função do schema public, e por padrão
-- EXECUTE é concedido a public. award_points é SECURITY DEFINER e recebe
-- perfil e quantidade como argumento: exposta assim, qualquer usuário logado
-- poderia conceder a si mesmo pontos ilimitados via
-- POST /rest/v1/rpc/award_points — e pontos são resgatáveis.
--
-- Revogar não afeta as triggers: elas rodam com os privilégios do dono da
-- função, não de quem disparou o comando.

revoke execute on function public.award_points(uuid, public.point_source_type, uuid, integer, text)
  from public, anon, authenticated;

revoke execute on function public.handle_profile_completion() from public, anon, authenticated;
revoke execute on function public.handle_order_review_points() from public, anon, authenticated;

-- search_path fixo: sem isso, quem chama pode trocar o schema de resolução dos
-- nomes usados dentro da função.
alter function public.point_value(text) set search_path = public;
