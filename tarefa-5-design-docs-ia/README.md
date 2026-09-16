# Da Reunião ao Documento — processo de produção

## Sobre o desafio

Este repositório transforma a reunião técnica registrada em `TRANSCRICAO.md` num pacote de design docs para webhooks de mudança de status de pedidos. A entrega é deliberadamente documental: o código do OMS foi lido como evidência de padrões e pontos de integração, mas não foi alterado.

O objetivo foi separar as alturas dos documentos: ADRs registram decisões fechadas, RFC propõe a arquitetura para revisão, FDD permite implementação e PRD explica valor/escopo. O tracker preserva a origem de cada afirmação relevante.

## Ferramentas de IA utilizadas

- Codex: leitura estruturada da transcrição e do repositório, geração inicial e revisão de consistência dos documentos.
- Terminal do workspace: inventário dos arquivos reais e conferência dos caminhos citados no FDD e tracker.

## Workflow adotado

1. Li a transcrição procurando decisões, requisitos, exclusões e questões explicitamente adiadas.
2. Mapeei a transação de pedidos, autenticação, erros, logger, Prisma e roteamento do OMS.
3. Registrei as seis decisões principais em ADRs.
4. Consolidei a proposta no RFC, detalhei contratos e fluxos no FDD e então produzi o PRD.
5. Construí o tracker com timestamps ou caminhos de código e revisei a checklist de aceite.

## Prompts customizados

```text
Leia TRANSCRICAO.md e separe em quatro grupos: decisões fechadas, requisitos funcionais,
itens explicitamente fora de escopo e questões em aberto. Para cada grupo, mantenha o
timestamp e o falante. Não transforme sugestões descartadas em requisitos.
```

```text
Examine apenas os módulos de pedidos, autenticação, erros, logger, Prisma e rotas.
Liste caminhos reais e explique onde um módulo de webhooks se integraria, sem propor
alterações em arquivos de código e sem inventar APIs não discutidas na reunião.
```

## Iterações e ajustes

Foram feitas três iterações principais. Na primeira, a síntese técnica misturava detalhes de implementação no RFC; a segunda moveu contratos, fluxos e matriz de erros para o FDD. Na revisão seguinte, foram removidas inferências não confirmadas e reforçados itens frequentemente esquecidos: snapshot do payload, rotação de secret, limite de 64 KB, exclusões de e-mail/dashboard e as limitações de ordering/rate limit. Por fim, cada caminho de código e afirmação importante foi confrontado com o tracker.

## Como navegar a entrega

1. [PRD](./docs/PRD.md) — problema, público, escopo e sucesso.
2. [RFC](./docs/RFC.md) — proposta e pontos para revisão.
3. [ADRs](./docs/adrs/) — decisões arquiteturais isoladas.
4. [FDD](./docs/FDD.md) — fluxos, contratos e integração implementável.
5. [Tracker](./docs/TRACKER.md) — origem na transcrição ou no código.
