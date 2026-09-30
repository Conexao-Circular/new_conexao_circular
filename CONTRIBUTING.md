# Contribuindo

Obrigado pelo interesse na Conexão Circular.

## Antes de contribuir

- leia o README e a documentação em `docs/`;
- use dados fictícios ou anonimizados;
- não conecte testes a serviços de produção;
- não inclua segredos, dados pessoais ou arquivos operacionais;
- abra uma issue antes de mudanças grandes de produto ou arquitetura.

## Desenvolvimento

```bash
npm ci
cp .env.example .env.local
npm run lint
npm run test
npm run build
```

Pull Requests devem explicar o problema, a solução, os riscos e como a mudança
foi validada. Alterações em autenticação, RLS, Storage, pagamentos ou dados
pessoais exigem revisão adicional.

## Escopo de revisão

O CI verifica lint, TypeScript, testes e build. A aprovação do CI não substitui
a revisão de segurança, privacidade ou homologação operacional.
