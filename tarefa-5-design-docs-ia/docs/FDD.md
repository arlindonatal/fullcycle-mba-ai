# FDD — Webhooks de Notificação de Pedidos

## Contexto e motivação técnica

O `OrderService.changeStatus` já atualiza pedido, histórico e estoque numa transação. A entrega externa não pode participar do caminho síncrono. Este desenho acrescenta uma outbox transacional e um consumidor independente para transformar cada alteração elegível em POST HTTPS recuperável.

## Objetivos técnicos

1. Persistir o evento e a alteração de status atomicamente.
2. Entregar em até 10 s normalmente, sem bloquear a API.
3. Oferecer autenticação de origem, diagnóstico de entregas e recuperação manual.
4. Seguir módulos, erros, autenticação, Prisma e logger já adotados.

## Escopo e exclusões

Inclui configurações por cliente, outbox, worker, tentativa/retry, DLQ, histórico e rotas descritas abaixo. Exclui dashboard, e-mail de alerta, rate limit, retenção/arquivamento e múltiplos workers.

## Modelo lógico

- `webhooks`: UUID, `customer_id`, URL HTTPS, secret atual, secret anterior e expiração da anterior, `active`, filtros de status e timestamps.
- `webhook_outbox`: UUID `event_id`, `webhook_id`, `order_id`, payload JSON snapshot, estado (`PENDING`, `PROCESSING`, `DELIVERED`, `FAILED`), número da tentativa, `next_attempt_at`, timestamps. Índices em estado e criação; leitura ordenada por criação.
- `webhook_deliveries`: tentativa, payload, código/corpo de resposta, duração e erro para consulta de histórico.
- `webhook_dead_letter`: UUID, referência do evento/origem, payload, motivo e timestamp; o replay cria nova pendência na outbox.

Os UUIDs mantêm o padrão do schema atual. A modelagem física, migration e campos exatos devem ser revisados na implementação; este documento não altera o schema.

## Fluxos detalhados

### Criação de evento na outbox

1. `PATCH /orders/:id/status` chega autenticado e validado.
2. `OrderService.changeStatus` inicia a transação existente, valida transição e atualiza estoque, pedido e histórico.
3. A função proposta `publishWebhookEvent(tx, order, fromStatus, toStatus)` busca endpoints ativos do `customer_id` cujo filtro contém `toStatus`.
4. Para cada endpoint elegível, cria na mesma `tx` uma linha com UUID e payload renderizado: o snapshot representa o momento da transição, não uma consulta posterior.
5. Falha na inserção reverte toda a transação. Sem endpoint inscrito, nenhuma linha é criada.

### Processamento pelo worker

1. O novo entry point do worker cria seu próprio `PrismaClient` e inicia loop a cada 2 s.
2. Em batch pequeno, seleciona os `PENDING` mais antigos cujo `next_attempt_at` venceu e os marca como processamento.
3. Faz POST para a URL com timeout de 10 s, corpo JSON e headers abaixo.
4. Registra uma entrega; sucesso marca o evento como `DELIVERED`. O worker é único nesta fase, preservando ordem por pedido por ordem de criação.

### Retry e DLQ

Falha por timeout ou resposta não bem-sucedida registra a tentativa e agenda a próxima: 1 min, 5 min, 30 min, 2 h e 12 h. Há no máximo cinco tentativas. Após a quinta falha, copiar/mover a evidência para `webhook_dead_letter`, com payload, motivo e data, e marcar a origem como falha. `POST /admin/webhooks/dead-letter/:id/replay` exige `ADMIN`, registra o usuário que disparou a ação e recoloca uma nova entrada pendente na outbox.

## Contratos públicos

Todas as rotas são prefixadas por `/api/v1`, usam `Authorization: Bearer <JWT>` e retornam o envelope de erro existente quando aplicável.

### Criar endpoint — `POST /customers/:customerId/webhooks`

Request:
```json
{"url":"https://erp.atlas.example/hooks/orders","events":["SHIPPED","DELIVERED"]}
```
Response `201` (a secret é exibida na criação):
```json
{"id":"uuid","customerId":"uuid","url":"https://erp.atlas.example/hooks/orders","events":["SHIPPED","DELIVERED"],"active":true,"secret":"whsec_..."}
```
Erros: `400 WEBHOOK_INVALID_URL`, `404 WEBHOOK_CUSTOMER_NOT_FOUND`.

### Listar endpoints — `GET /customers/:customerId/webhooks`

Response `200`:
```json
{"items":[{"id":"uuid","url":"https://erp.atlas.example/hooks/orders","events":["SHIPPED"],"active":true}]}
```

### Alterar endpoint — `PATCH /webhooks/:id`

Request:
```json
{"url":"https://erp.atlas.example/hooks/v2","events":["PROCESSING","SHIPPED"],"active":true}
```
Response `200`: configuração atualizada sem expor secret. Erros: `400 WEBHOOK_INVALID_URL`, `404 WEBHOOK_NOT_FOUND`.

### Excluir endpoint — `DELETE /webhooks/:id`

Response `204`. Erro `404 WEBHOOK_NOT_FOUND`.

### Rotacionar secret — `POST /webhooks/:id/secret/rotate`

Response `200`:
```json
{"id":"uuid","secret":"whsec_nova","previousSecretValidUntil":"2026-09-17T12:00:00.000Z"}
```
Erro `404 WEBHOOK_NOT_FOUND`. A assinatura aceita secret atual e a anterior até a expiração de 24 h.

### Histórico — `GET /webhooks/:id/deliveries`

Response `200` (máximo 100 itens):
```json
{"items":[{"eventId":"uuid","status":"DELIVERED","attempt":1,"statusCode":200,"durationMs":164,"payload":{"event_type":"order.status_changed"},"response":"ok","createdAt":"2026-09-16T12:00:00.000Z"}]}
```

### Replay de DLQ — `POST /admin/webhooks/dead-letter/:id/replay`

Response `202`:
```json
{"deadLetterId":"uuid","outboxEventId":"uuid","status":"PENDING"}
```
Erros: `403 FORBIDDEN`, `404 WEBHOOK_DEAD_LETTER_NOT_FOUND`.

### Contrato de entrega ao cliente

`POST <webhook.url>` com `Content-Type: application/json`, `X-Event-Id`, `X-Webhook-Id`, `X-Timestamp` e `X-Signature` (HMAC-SHA256 sobre os bytes do corpo). Exemplo:
```json
{"event_id":"uuid","event_type":"order.status_changed","timestamp":"2026-09-16T12:00:00.000Z","order_id":"uuid","order_number":"ORD-000123","from_status":"PAID","to_status":"SHIPPED","customer_id":"uuid","total_cents":25990}
```
O receptor deve deduplicar por `X-Event-Id` e pode obter detalhes em `GET /orders/:id`; itens não são enviados.

## Matriz de erros previstos

| Código | HTTP | Situação |
| --- | --- | --- |
| `WEBHOOK_INVALID_URL` | 400 | URL não é HTTPS válida. |
| `WEBHOOK_SECRET_REQUIRED` | 400 | Operação exige secret válida. |
| `WEBHOOK_PAYLOAD_TOO_LARGE` | 422 | Snapshot excede 64 KB; não truncar. |
| `WEBHOOK_NOT_FOUND` | 404 | Endpoint não existe. |
| `WEBHOOK_CUSTOMER_NOT_FOUND` | 404 | Cliente não existe ao cadastrar. |
| `WEBHOOK_DEAD_LETTER_NOT_FOUND` | 404 | Item de DLQ não existe para replay. |
| `WEBHOOK_DELIVERY_FAILED` | 502 | Falha interna registrada na tentativa de entrega; não é resposta do CRUD. |

## Estratégias de resiliência

Timeout de 10 s, polling de 2 s, batch pequeno e estados persistidos evitam bloquear a API e permitem retomar após reinício. Retries usam o calendário fechado e DLQ é fallback operacional. Não há fallback por e-mail. O payload snapshot elimina divergência causada por mudanças posteriores do pedido; a contrapartida é que se deve recusar, e não truncar, conteúdo acima de 64 KB.

## Observabilidade

- Métricas: pendências por estado, idade da pendência mais antiga, tentativas, entregas/falhas, entradas/replays de DLQ, duração HTTP e latência fim a fim.
- Logs Pino estruturados: `eventId`, `webhookId`, `orderId`, tentativa, resultado, `statusCode`, duração e ator de replay; nunca secret ou assinatura em claro.
- Tracing: propagar/correlacionar `eventId` entre criação, tentativa, entrega e DLQ para diagnóstico.

## Integração com o sistema existente

| Caminho existente | Integração proposta |
| --- | --- |
| `src/modules/orders/order.service.ts` | Estender `changeStatus` dentro do `$transaction` para chamar `publishWebhookEvent(tx, ...)` após atualizar pedido/histórico. |
| `prisma/schema.prisma` | Adicionar modelos/tabelas de configuração, outbox, entregas e DLQ, mantendo UUID e MySQL/Prisma. |
| `src/config/database.ts` | O worker instancia `PrismaClient` próprio no processo separado, usando a mesma configuração/banco. |
| `src/server.ts` | Servidor HTTP segue separado; o novo entry point do consumidor replica seu padrão de bootstrap e shutdown. |
| `src/middlewares/auth.middleware.ts` | Rotas comuns usam `authenticate`; replay aplica `requireRole('ADMIN')`. |
| `src/shared/errors/app-error.ts` e `src/shared/errors/http-errors.ts` | Criar erros especializados derivados de `AppError` com prefixo `WEBHOOK_`, preservando formato HTTP central. |
| `src/middlewares/error.middleware.ts` | Reusar serialização de `AppError` e Zod, sem novo middleware de erro. |
| `src/shared/logger/index.ts` | Reusar Pino e sua redação; ampliar lista de campos sensíveis se necessário para secrets de webhook. |
| `src/routes/index.ts` e `src/app.ts` | Registrar controller/router `webhooks` no mesmo padrão de composição dos módulos existentes. |

## Dependências e compatibilidade

Node.js/TypeScript, Express, Prisma/MySQL, Zod, JWT, Pino e os módulos existentes são reutilizados. O novo script `npm run worker` é uma necessidade de execução acordada; nenhuma fila, broker ou cluster Redis é introduzido. Clientes precisam aceitar HTTPS e HMAC-SHA256.

## Critérios de aceite técnicos

- Rollback de `changeStatus` também elimina a linha de outbox; commit deixa o snapshot persistido.
- Worker separado só busca pendências vencidas, registra cada tentativa e respeita timeout/backoff/DLQ.
- HMAC confere sobre o corpo enviado; rotação aceita a secret anterior por 24 h.
- Contratos acima retornam os status e erros indicados; replay é negado para não-admin e auditado para admin.
- Logs, métricas e trace permitem rastrear um `eventId` até sucesso ou DLQ.

## Riscos e mitigação

Risco de concorrência/múltiplos workers é mitigado por manter um processo único nesta fase. Risco de endpoint hostil ou lento é contido por HTTPS, timeout, retry e isolamento do worker. Risco de duplicata é comunicado pelo contrato e mitigado pelo identificador estável. Risco de vazamento de credenciais é reduzido por secret por endpoint, rotação e logger com redação.
