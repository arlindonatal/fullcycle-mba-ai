# ADR-001 — Outbox no MySQL

## Status
Aceito — 09/09/2026.

## Contexto
Uma alteração de status atualiza pedido, histórico e possivelmente estoque numa transação. Entregar HTTP dentro dela exporia o fluxo a indisponibilidade externa e permitiria estado confirmado sem evento durável.

## Decisão
Inserir um evento snapshot em `webhook_outbox` na mesma transação MySQL da alteração de status. O worker entrega a mensagem posteriormente. A outbox terá índices de estado e `created_at`.

## Alternativas Consideradas
- HTTP síncrono no serviço: descartado por bloquear a transação e não ter rollback apropriado para cliente fora do ar.
- Redis Streams: descartado por adicionar cluster/infra para um time pequeno.

## Consequências
Positivas: commit do pedido e registro do evento são atômicos, sem dependência de rede. Negativas: novas tabelas e polling; a outbox pode crescer e exigirá retenção futura.
