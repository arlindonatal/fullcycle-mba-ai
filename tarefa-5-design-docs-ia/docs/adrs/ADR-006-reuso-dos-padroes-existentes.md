# ADR-006 — Reuso dos padrões existentes

## Status
Aceito — 09/09/2026.

## Contexto
O OMS já organiza domínios em módulos com controller, service, repository, routes e schemas; possui `AppError`, middleware central de erro, Pino, Prisma e autorização por papel. Uma feature paralela com convenções próprias elevaria manutenção e risco.

## Decisão
Criar o módulo `webhooks` seguindo a estrutura dos módulos existentes. Estender `src/modules/orders/order.service.ts` com publicação transacional via `tx`; registrar rotas em `src/routes/index.ts`; reutilizar `AppError`, Zod, Pino e `requireRole('ADMIN')`. O worker terá entrada própria e Prisma por processo.

## Alternativas Consideradas
- Criar serviço/microserviço separado: descartado nesta fase por duplicar infraestrutura e integração.
- Adotar logger/middleware de erros específico: descartado porque os componentes atuais já atendem ao módulo.

## Consequências
Positivas: comportamento consistente, menor curva de manutenção e erros uniformes. Negativas: a composição de dependências da aplicação e a transação do pedido passam a conhecer a publicação de eventos.
