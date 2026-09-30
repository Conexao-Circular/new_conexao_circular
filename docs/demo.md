# Demonstração segura

## Princípios

O clone público deve funcionar sem acesso a produção. Use um projeto Supabase
separado, dados fictícios e integrações em sandbox.

Antes de criar uma demonstração hospedada, confirme que:

- o banco é descartável ou contém somente dados fictícios;
- nenhum e-mail, pagamento ou webhook real pode ser disparado;
- uploads estão limitados a arquivos de teste;
- o modo de pagamento simulado está explicitamente habilitado apenas para
  demonstração;
- a URL e as credenciais não são reutilizadas em produção.

Para uma demonstração descartável, `DEMO_MODE=true` e uma service-role key de
um projeto Supabase de teste podem ser usadas somente no servidor. Em qualquer
ambiente real, mantenha `DEMO_MODE=false` e configure um gateway homologado.

## Limitações conhecidas

O código contém jornadas que ainda dependem de homologação de pagamentos,
conciliação, logística, permissões e operação de campo. Uma tela funcional não
deve ser interpretada como garantia operacional, financeira ou jurídica.
