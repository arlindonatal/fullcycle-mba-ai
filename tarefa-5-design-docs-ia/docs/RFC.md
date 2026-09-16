# RFC — Sistema de Webhooks de Notificação de Pedidos

| Campo | Valor |
| --- | --- |
| Autor | Larissa (Tech Lead) |
| Status | Proposto para revisão |
| Data | 16/09/2026 |
| Revisores | Marcos, Bruno, Diego e Sofia |

## TL;DR

Propomos registrar eventos de mudança de status na mesma transação MySQL do pedido e entregá-los por um worker Node.js separado, em polling de 2 segundos. A entrega é assinada com HMAC-SHA256 e usa at-least-once com `X-Event-Id`. Falhas seguem retry limitado e DLQ. A proposta atende ao alvo de menos de 10 segundos sem bloquear o fluxo crítico de pedidos.

## Contexto e problema

Clientes B2B hoje consultam pedidos repetidamente. Adicionar uma chamada HTTP síncrona ao `changeStatus` deixaria a transação vulnerável à latência ou indisponibilidade de cada cliente, inclusive sem uma resposta correta para rollback. É necessário desacoplar confirmação do pedido de entrega externa, mantendo a evidência de que cada alteração confirmada gerou evento.

## Proposta técnica

O módulo `webhooks` mantém configurações por cliente e produz um snapshot de `order.status_changed` para cada endpoint ativo e inscrito no status. A publicação usa uma outbox no MySQL dentro da transação atual de pedido. Um único processo worker lê pendências em ordem de criação a cada 2 segundos, faz POST HTTPS, registra o resultado e aplica a política de retry/DLQ. A API e o worker compartilham banco, Prisma e padrões da aplicação, mas são processos distintos.

Cada requisição externa transporta corpo JSON assinado por HMAC-SHA256 e os identificadores de evento e endpoint. A API oferece CRUD autenticado, histórico de entregas e replay administrativo. Detalhes de tabelas, rotas e tratamento de erros estão no [FDD](./FDD.md).

## Alternativas consideradas

| Alternativa | Motivo do descarte |
| --- | --- |
| Chamada HTTP síncrona no serviço de pedidos | Um cliente lento ou indisponível atrasaria a transação e não deve provocar rollback do status. |
| Redis Streams / cluster Redis | Exigiria infraestrutura nova para um time pequeno; a outbox no MySQL existente atende à necessidade. |
| Trigger de banco para despertar o worker | MySQL não possui equivalente a `LISTEN/NOTIFY`; trigger só executa SQL e exigiria um mecanismo improvisado. |
| Retry indefinido | Eventos poderiam ficar pendurados para sempre caso o cliente desaparecesse. |
| Exactly-once | Exigiria coordenação entre os dois lados; at-least-once com idempotência é o trade-off aceito. |

## Questões em aberto

- Rate limiting por endpoint: observar o comportamento antes de definir limite; não entra nesta fase.
- Escalonamento horizontal e ordering: a garantia atual vale por `order_id` enquanto houver um worker; particionamento/locks ficam para futuro.
- Retenção/arquivamento dos eventos entregues: a conversa citou cerca de 30 dias, mas a implementação foi deixada fora do escopo.
- Notificação por e-mail de falhas: adiada para uma próxima fase.

## Impacto e riscos

Há novas tabelas e um processo operacional a monitorar. A outbox aumenta escrita transacional, mas protege a consistência. Polling adiciona até 2 segundos de espera, aceito pelo produto. Segredos e dados enviados exigem HTTPS, assinatura e revisão de segurança. Duplicatas são esperadas e documentadas para integradores.

## Decisões relacionadas

- [ADR-001 — Outbox no MySQL](./adrs/ADR-001-outbox-no-mysql.md)
- [ADR-002 — Worker em polling separado](./adrs/ADR-002-worker-separado-com-polling.md)
- [ADR-003 — Retry e DLQ](./adrs/ADR-003-retry-com-backoff-e-dlq.md)
- [ADR-004 — HMAC por endpoint](./adrs/ADR-004-hmac-sha256-por-endpoint.md)
- [ADR-005 — At-least-once](./adrs/ADR-005-at-least-once-com-event-id.md)
- [ADR-006 — Reuso dos padrões](./adrs/ADR-006-reuso-dos-padroes-existentes.md)
