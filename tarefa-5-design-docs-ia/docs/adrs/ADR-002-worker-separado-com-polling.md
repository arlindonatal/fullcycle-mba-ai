# ADR-002 — Worker separado com polling

## Status
Aceito — 09/09/2026.

## Contexto
O evento persistido precisa ser entregue sem disputar o ciclo da API. MySQL não oferece mecanismo nativo equivalente a `LISTEN/NOTIFY`. A meta de produto aceita menos de 10 segundos.

## Decisão
Executar um processo Node.js separado, com `PrismaClient` próprio e mesmo banco, que consulta os eventos pendentes mais antigos a cada 2 segundos. Nesta fase haverá um único worker, com ordering implícita por `order_id`/criação.

## Alternativas Consideradas
- Worker dentro da instância de API: descartado; reinício da API interromperia o consumidor.
- Trigger de banco: descartado porque somente executa SQL e não notifica processo externo.

## Consequências
Positivas: isolamento de falhas e latência adequada. Negativas: há até 2 s de espera e um processo adicional para operar; múltiplos workers e ordering global não são suportados agora.
