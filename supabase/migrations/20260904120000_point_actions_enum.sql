-- Sprint 6 — novas origens de ponto.
--
-- Fica numa migration separada de propósito: um valor adicionado a um enum não
-- pode ser usado na mesma transação em que foi criado, e cada arquivo de
-- migration roda na sua própria transação. As triggers que usam esses valores
-- estão em 20260904120100.

alter type public.point_source_type add value if not exists 'signup_complete';
alter type public.point_source_type add value if not exists 'first_purchase';
alter type public.point_source_type add value if not exists 'order_review';
