-- Doc categories the curadoria actually asks for (Cartão CNPJ, documento de
-- identificação do responsável) had no dedicated type — everyone was
-- dumping them under "outro", making review slower.

alter table public.producer_application_documents drop constraint producer_application_documents_document_type_check;

alter table public.producer_application_documents
  add constraint producer_application_documents_document_type_check
  check (document_type in ('cartao_cnpj', 'licenca', 'documento_responsavel', 'certificacao', 'foto_operacao', 'outro'));
