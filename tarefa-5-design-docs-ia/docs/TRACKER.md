# Tracker de Rastreabilidade

| ID | Documento | Tipo | Conteúdo (resumo) | Fonte | Localização |
| --- | --- | --- | --- | --- | --- |
| PRD-CTX-01 | docs/PRD.md | Problema | Clientes fazem polling de pedidos, tornando integração lenta e cara. | TRANSCRICAO | [09:00] Marcos |
| PRD-MET-01 | docs/PRD.md | Métrica | Entrega abaixo de 10 s é considerada tempo real. | TRANSCRICAO | [09:02] Marcos |
| PRD-SCP-01 | docs/PRD.md | Escopo | Webhooks são somente de saída. | TRANSCRICAO | [09:02] Marcos |
| PRD-FR-01 | docs/PRD.md | Requisito Funcional | Cadastrar URL, secret gerada e filtros de status. | TRANSCRICAO | [09:31] Marcos |
| PRD-FR-02 | docs/PRD.md | Requisito Funcional | CRUD de endpoint e filtro por status. | TRANSCRICAO | [09:33] Bruno |
| PRD-FR-03 | docs/PRD.md | Regra de negócio | Filtrar na inserção da outbox. | TRANSCRICAO | [09:34] Bruno |
| PRD-FR-04 | docs/PRD.md | Requisito Funcional | Persistir snapshot na inserção. | TRANSCRICAO | [09:52] Larissa |
| PRD-FR-05 | docs/PRD.md | Contrato | Payload JSON com dados básicos, sem itens. | TRANSCRICAO | [09:43] Diego |
| PRD-FR-06 | docs/PRD.md | Requisito Funcional | Cinco retries e DLQ. | TRANSCRICAO | [09:15] Diego; [09:18] Diego |
| PRD-FR-07 | docs/PRD.md | Requisito Funcional | Histórico das últimas 100 entregas. | TRANSCRICAO | [09:34] Marcos |
| PRD-FR-08 | docs/PRD.md | Requisito Funcional | Replay manual da DLQ, auditado e exclusivo de ADMIN. | TRANSCRICAO | [09:18] Diego; [09:35] Sofia |
| PRD-FR-09 | docs/PRD.md | Segurança | Secret por endpoint com rotação e janela de 24 h. | TRANSCRICAO | [09:21] Sofia |
| PRD-FR-10 | docs/PRD.md | Idempotência | X-Event-Id permite deduplicação do cliente. | TRANSCRICAO | [09:24] Diego |
| PRD-NFR-01 | docs/PRD.md | Restrição | HTTPS obrigatório. | TRANSCRICAO | [09:23] Sofia |
| PRD-NFR-02 | docs/PRD.md | Restrição | Payload limitado a 64 KB e não deve ser truncado. | TRANSCRICAO | [09:23] Sofia; [09:24] Diego |
| PRD-NFR-03 | docs/PRD.md | Restrição | Timeout HTTP de 10 segundos. | TRANSCRICAO | [09:42] Diego |
| PRD-OOS-01 | docs/PRD.md | Fora de escopo | Alerta por e-mail é fase futura. | TRANSCRICAO | [09:37] Larissa |
| PRD-OOS-02 | docs/PRD.md | Fora de escopo | Dashboard visual não entra nesta fase. | TRANSCRICAO | [09:40] Larissa |
| RFC-ALT-01 | docs/RFC.md | Trade-off | Chamada síncrona é descartada porque bloquearia a transação. | TRANSCRICAO | [09:04] Bruno |
| RFC-ALT-02 | docs/RFC.md | Trade-off | Redis Streams é overengineering para o time pequeno. | TRANSCRICAO | [09:07] Diego |
| RFC-OQ-01 | docs/RFC.md | Questão em aberto | Rate limiting de saída será observado antes de decidir. | TRANSCRICAO | [09:38] Larissa |
| RFC-OQ-02 | docs/RFC.md | Limitação | Múltiplos workers/particionamento ficam para futuro. | TRANSCRICAO | [09:12] Diego; [09:13] Larissa |
| FDD-FLOW-01 | docs/FDD.md | Fluxo | Outbox é criada na mesma transação da mudança do pedido. | TRANSCRICAO | [09:06] Diego; [09:40] Bruno |
| FDD-FLOW-02 | docs/FDD.md | Fluxo | Worker busca pendências a cada 2 segundos em batch. | TRANSCRICAO | [09:08] Diego; [09:09] Diego |
| FDD-FLOW-03 | docs/FDD.md | Resiliência | Backoff é 1m/5m/30m/2h/12h. | TRANSCRICAO | [09:17] Diego |
| FDD-CON-01 | docs/FDD.md | Contrato | Headers incluem Event-Id, Signature, Timestamp e Webhook-Id. | TRANSCRICAO | [09:44] Diego; [09:44] Sofia |
| FDD-INT-01 | docs/FDD.md | Integração | changeStatus contém transação, histórico e atualização de estoque. | CODIGO | src/modules/orders/order.service.ts |
| FDD-INT-02 | docs/FDD.md | Integração | Modelos usam UUID e datasource é MySQL. | CODIGO | prisma/schema.prisma |
| FDD-INT-03 | docs/FDD.md | Integração | PrismaClient é criado em módulo próprio. | CODIGO | src/config/database.ts |
| FDD-INT-04 | docs/FDD.md | Integração | authenticate e requireRole suportam JWT e ADMIN. | CODIGO | src/middlewares/auth.middleware.ts |
| FDD-INT-05 | docs/FDD.md | Integração | AppError carrega status, código e detalhes. | CODIGO | src/shared/errors/app-error.ts |
| FDD-INT-06 | docs/FDD.md | Integração | Middleware serializa AppError e Zod. | CODIGO | src/middlewares/error.middleware.ts |
| FDD-INT-07 | docs/FDD.md | Integração | Logger Pino já faz redação de campos sensíveis. | CODIGO | src/shared/logger/index.ts |
| FDD-INT-08 | docs/FDD.md | Integração | Router central monta os módulos por prefixo. | CODIGO | src/routes/index.ts |
| ADR-001 | docs/adrs/ADR-001-outbox-no-mysql.md | Decisão | Usar outbox no MySQL, não fila externa. | TRANSCRICAO | [09:06] Diego; [09:08] Larissa |
| ADR-002 | docs/adrs/ADR-002-worker-separado-com-polling.md | Decisão | Worker separado em polling de 2 s. | TRANSCRICAO | [09:09] Diego; [09:11] Larissa |
| ADR-003 | docs/adrs/ADR-003-retry-com-backoff-e-dlq.md | Decisão | Cinco tentativas e DLQ separada. | TRANSCRICAO | [09:17] Larissa; [09:18] Diego |
| ADR-004 | docs/adrs/ADR-004-hmac-sha256-por-endpoint.md | Decisão | HMAC-SHA256, secret por endpoint e rotação. | TRANSCRICAO | [09:20] Sofia; [09:21] Sofia |
| ADR-005 | docs/adrs/ADR-005-at-least-once-com-event-id.md | Decisão | At-least-once e X-Event-Id. | TRANSCRICAO | [09:24] Diego; [09:25] Diego |
| ADR-006 | docs/adrs/ADR-006-reuso-dos-padroes-existentes.md | Decisão | Reutilizar módulos, AppError, Pino, Zod e middleware existentes. | TRANSCRICAO | [09:27] Bruno; [09:29] Bruno; [09:30] Larissa |
