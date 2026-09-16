# ADR-003 — Retry com backoff e DLQ

## Status
Aceito — 09/09/2026.

## Contexto
Endpoints de clientes podem estar indisponíveis por horas. Falhas não devem desaparecer nem manter evento pendurado indefinidamente.

## Decisão
Fazer cinco tentativas, com backoff de 1 min, 5 min, 30 min, 2 h e 12 h. Após o teto, persistir payload, motivo e timestamp em `webhook_dead_letter`. Um `ADMIN` pode fazer replay manual.

## Alternativas Consideradas
- Três tentativas: descartado por não cobrir indisponibilidade planejada de duas horas já observada.
- Retry indefinido: descartado por deixar eventos sem resolução quando o cliente desaparece.
- Marcar falha na própria outbox: descartado em favor de DLQ separada, mais limpa para leitura e diagnóstico.

## Consequências
Positivas: recuperação automática e evidência operacional. Negativas: entrega final pode ocorrer cerca de 15 horas após a primeira falha e DLQ requer operação humana.
