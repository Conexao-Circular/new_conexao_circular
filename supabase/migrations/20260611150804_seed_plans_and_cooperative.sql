insert into public.plans (audience, slug, name, price_cents, description, benefits, highlighted, sort_order) values
('consumidor', 'consumidor-broto', 'Broto', 1500, 'Plano de entrada para quem está começando a jornada circular.',
  '["5% de desconto na rede de parceiros"]'::jsonb, false, 1),
('consumidor', 'consumidor-terra', 'Terra', 4000, 'Para quem quer ir além com mimos sazonais.',
  '["5% de desconto na rede de parceiros", "Brinde sazonal a cada 3 meses"]'::jsonb, true, 2),
('consumidor', 'consumidor-oceano', 'Oceano', 9000, 'Inclui coleta periódica de resíduos orgânicos.',
  '["5% de desconto na rede de parceiros", "Brinde sazonal a cada 3 meses", "Coleta de resíduos orgânicos quinzenal"]'::jsonb, false, 3),
('consumidor', 'consumidor-familia', 'Família', 20000, 'Plano completo para residências com até 3 pessoas.',
  '["5% de desconto na rede de parceiros", "Brinde sazonal a cada 3 meses", "Coleta de resíduos orgânicos quinzenal", "Coleta semanal de resíduos (até 3 pessoas)"]'::jsonb, false, 4),

('produtor', 'produtor-broto', 'Broto', 4000, 'Comece a vender com o selo Conexão Circular.',
  '["Selo Conexão Circular", "Perfil no e-commerce (12,5% por venda)"]'::jsonb, false, 1),
('produtor', 'produtor-arvore', 'Árvore', 9000, 'Mais visibilidade e mentorias ESG.',
  '["Selo Conexão Circular", "Perfil no e-commerce (12,5% por venda)", "Visibilidade no app", "Mentorias coletivas ESG"]'::jsonb, true, 2),
('produtor', 'produtor-terra', 'Terra', 18000, 'Inclui consultoria especializada Sistema B Brasil.',
  '["Selo Conexão Circular", "Perfil no e-commerce (12,5% por venda)", "Visibilidade no app", "Mentorias coletivas ESG", "Consultoria Sistema B Brasil (10h)"]'::jsonb, false, 3),
('produtor', 'produtor-global', 'Global', null, 'Plano sob consulta para operações de maior porte.',
  '["Selo Conexão Circular", "Perfil no e-commerce (12,5% por venda)", "Visibilidade no app", "Mentorias coletivas ESG", "Consultoria Sistema B Brasil (10h)", "Podcast e push exclusivos", "Coleta de resíduos"]'::jsonb, false, 4);

-- Public demo seed only. It intentionally contains no real organization or
-- personal data. Production cooperatives are created through the application.
insert into public.cooperatives (name, document, type, service_area, capacity_kg_day, contact_name, contact_phone, status) values
('Cooperativa de Demonstração', null, 'both', 'Cidade de demonstração - UF', 0, 'Contato de demonstração', null, 'active');
