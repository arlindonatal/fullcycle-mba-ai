# PRD — Webhooks de Notificação de Pedidos

**Status:** proposto · **Data:** 16/09/2026 · **Responsável:** Produto e Plataforma

## Resumo e contexto da feature

Clientes B2B precisam receber uma notificação quando o status de seus pedidos mudar. Hoje eles consultam repetidamente `GET /orders`, o que torna a integração lenta e cara. A feature introduz webhooks **somente de saída** para eventos `order.status_changed`.

## Problema e motivação

Atlas Comercial, MaxDistribuição e Nova Cargo solicitaram a capacidade; a Atlas sinalizou risco de migração se não houver entrega até o fim do trimestre. Para esses clientes, entrega abaixo de 10 segundos é considerada tempo real. A solução elimina a necessidade de polling do lado do cliente, sem comprometer a mudança transacional do pedido.

## Público-alvo e cenários de uso

- Integradores técnicos de clientes B2B que cadastram uma URL e os status de interesse.
- Sistemas dos clientes que recebem eventos e atualizam seus próprios fluxos.
- Administradores internos que investigam uma entrega falha e fazem replay da DLQ.

## Objetivos e métricas de sucesso

- Entregar as alterações de status selecionadas sem exigir polling do cliente.
- Atender à expectativa de latência: evento elegível entregue em menos de **10 segundos** em condição normal; o polling planejado é de 2 segundos.
- Preservar a consistência: se a alteração do pedido for confirmada, seu registro de evento também deve existir; se a transação reverter, nenhum evento deve sair.
- Planejamento de entrega: três sprints, incluindo dois dias úteis de revisão de segurança antes do deploy.

## Escopo

### Incluso

- CRUD autenticado de endpoints por cliente, com URL, secret gerada e filtro de status.
- Registro atômico de evento de mudança de status em outbox MySQL.
- Worker separado para entrega HTTP, retry e DLQ.
- Histórico das últimas 100 entregas de cada endpoint.
- Assinatura HMAC-SHA256, HTTPS obrigatório, secret por endpoint e rotação com sobreposição de 24 horas.
- Replay manual de DLQ somente para `ADMIN`, com auditoria de quem o executou.

### Fora de escopo

- E-mail de aviso após falhas consecutivas: explicitamente adiado para fase futura.
- Dashboard visual para o cliente: será um projeto separado do frontend; esta fase oferece somente API.
- Rate limiting de saída: será observado e decidido posteriormente.
- Arquivamento de eventos entregues e escala com múltiplos workers.

## Requisitos funcionais

| ID | Requisito |
| --- | --- |
| PRD-FR-01 | Permitir criar webhook com `url`, filtro de status e secret gerada pelo sistema. |
| PRD-FR-02 | Permitir listar, editar e excluir endpoints de um cliente autenticado. |
| PRD-FR-03 | Criar evento somente quando o endpoint ativo do cliente estiver inscrito no status de destino. |
| PRD-FR-04 | Persistir um snapshot do evento junto à alteração de status do pedido. |
| PRD-FR-05 | Enviar `order.status_changed` em JSON com dados básicos do pedido, sem itens. |
| PRD-FR-06 | Retentar falhas até cinco vezes com os intervalos acordados e enviar falhas finais à DLQ. |
| PRD-FR-07 | Expor as últimas 100 entregas, incluindo resultado, payload, resposta e duração. |
| PRD-FR-08 | Permitir replay de um item da DLQ por rota administrativa, registrando o autor. |
| PRD-FR-09 | Permitir rotação da secret; a anterior permanece válida por 24 horas. |
| PRD-FR-10 | Enviar `X-Event-Id` único para o cliente deduplicar entregas repetidas. |

## Requisitos não funcionais

- A URL cadastrada deve usar HTTPS; HTTP deve ser rejeitado na validação.
- Limite máximo de payload: 64 KB; acima disso a entrega deve falhar, sem truncamento.
- Timeout de chamada externa: 10 segundos.
- A semântica de entrega é at-least-once; ordenação é apenas por pedido enquanto houver um worker.
- Logs devem preservar a confidencialidade de secrets e responder ao padrão de observabilidade existente.

## Decisões e trade-offs principais

Outbox no MySQL evita acoplar a transação de pedidos à rede e dispensa nova infraestrutura, em troca de polling. A garantia at-least-once aceita duplicatas para evitar a complexidade de exactly-once; o cliente deduplica por ID. O payload é snapshot e enxuto, preservando o estado da transição e evitando itens grandes.

## Dependências

MySQL e Prisma existentes, processo Node.js adicional para o worker, conectividade HTTPS dos clientes, JWT já usado pela API e revisão de segurança de HMAC/geração de secret.

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Endpoint lento ou indisponível acumular entregas | Média | Alto | Timeout de 10 s, cinco retries com backoff e DLQ persistida. |
| Vazamento de secret do cliente | Média | Alto | Secret única por endpoint, HMAC e rotação com janela de 24 h. |
| Duplicata provocar ação repetida no cliente | Média | Médio | Contrato explícito at-least-once e `X-Event-Id` único para deduplicação. |
| Crescimento da outbox | Baixa nesta fase | Médio | Índices de status/criação, batches pequenos; arquivamento é acompanhamento futuro. |

## Critérios de aceitação

- Um status elegível confirmado cria evento na mesma transação e o worker o entrega.
- Um endpoint HTTPS ativo recebe assinatura e headers definidos; endpoint HTTP é rejeitado.
- Falha de entrega segue cinco tentativas e termina em DLQ, passível de replay por `ADMIN`.
- Cliente consulta até 100 entregas; os dados incluem payload, resposta, status e duração.
- Requisição repetida pode ser identificada pelo mesmo `X-Event-Id`.

## Estratégia de testes e validação

Testes unitários devem cobrir filtros, HMAC, rotação, limite e calendário de retry. Testes de integração devem confirmar atomicidade do `changeStatus`, contratos HTTP e autorização do replay. Um teste ponta a ponta com receptor controlado deve validar sucesso, timeout, duplicata/retry e ida à DLQ. Antes do deploy, Sofia revisa a implementação de geração/armazenamento de secret e assinatura.
