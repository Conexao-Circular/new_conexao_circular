# Segurança

## O que não deve ser publicado

Não envie para este repositório:

- chaves Supabase, Asaas, Resend, Web Push ou Melhor Envio;
- arquivos `.env*`, exceto o `.env.example` sem valores reais;
- dados pessoais, documentos, telefones, endereços ou coordenadas identificáveis;
- dumps, backups, logs ou relatórios de importação;
- credenciais de CI/CD, deploy ou hospedagem.

## Como reportar uma suspeita

Não publique detalhes de uma vulnerabilidade em issue pública. Entre em contato
com a equipe responsável por um canal privado e informe:

1. componente afetado;
2. passos para reproduzir sem dados reais;
3. impacto potencial;
4. evidências mínimas necessárias para triagem.

Se um segredo for exposto, a prioridade é revogá-lo e rotacioná-lo no provedor,
mesmo antes de remover o arquivo do Git.

## Limites do repositório

Este repositório é público para transparência e colaboração. Produção, dados
reais, serviços gerenciados e credenciais devem permanecer em ambientes
privados e separados.
