# Segurança e privacidade

## Dados tratados pelo produto

Dependendo da jornada, a aplicação pode tratar cadastro, e-mail, telefone,
documentos de identificação, endereço, data de nascimento, dados bancários,
dados de pedido, evidências de coleta, notificações push e dados de parceiros.

O repositório público contém somente código e exemplos fictícios. Dados reais
devem existir apenas em ambientes controlados, com finalidade, retenção,
controle de acesso e base legal definidos pela equipe responsável.

## Princípios de publicação

- nenhum dado real em seeds, fixtures, screenshots ou testes;
- nenhum segredo em código, histórico, issue ou workflow;
- diretório público baseado em publicação/consentimento explícitos;
- documentos e evidências em buckets privados;
- acesso administrativo separado do acesso de participantes;
- logs e indicadores sem conteúdo pessoal desnecessário.

## Serviços externos

O produto pode integrar Supabase, Asaas, Melhor Envio, Resend, Web Push,
ViaCEP, BrasilAPI e serviços de geocodificação. Cada integração deve usar
somente os dados necessários, ambiente apropriado e credenciais de servidor.
Antes de uma operação real, a equipe deve revisar contratos, transferências,
retenção e configurações dos fornecedores.

## Mapa e diretório público

Um endereço ou coordenada não implica autorização para publicação. O fluxo
público deve expor somente registros marcados para publicação e somente os
campos de diretório aprovados. Proprietários, metadados de importação,
documentos e contatos internos não pertencem à resposta pública.

## Limite desta documentação

Este documento descreve práticas do repositório público; não é uma política de
privacidade completa, parecer jurídico ou certificação de segurança.
