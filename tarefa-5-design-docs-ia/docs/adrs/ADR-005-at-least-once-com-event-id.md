# ADR-005 — At-least-once com X-Event-Id

## Status
Aceito — 09/09/2026.

## Contexto
Uma resposta perdida após o receptor processar a mensagem torna impossível saber, unilateralmente, se ela foi consumida. A solução precisa ser confiável sem coordenação distribuída.

## Decisão
Oferecer garantia at-least-once. Gerar UUID na outbox e enviá-lo como `X-Event-Id`; o cliente deve deduplicar por esse valor.

## Alternativas Consideradas
- Exactly-once: descartado por exigir coordenação entre emissor e receptor e maior complexidade.
- Aceitar perda de evento: descartado por contrariar a confiabilidade da notificação.

## Consequências
Positivas: reprocessamento seguro e contrato conhecido por integradores. Negativas: clientes precisam implementar deduplicação e podem receber duplicatas.
