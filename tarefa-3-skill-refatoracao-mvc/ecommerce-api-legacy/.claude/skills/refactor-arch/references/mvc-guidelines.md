# Arquitetura MVC alvo

## Composition root e configuração

O entrypoint cria a aplicação, carrega configuração, instancia dependências e registra rotas/handlers. Configuração lê ambiente e define defaults seguros para desenvolvimento; segredos obrigatórios não possuem valores reais no fonte.

## Models e repositórios

Representam entidades, invariantes e persistência. SQL fica parametrizado nesta camada. Não conhecem objetos HTTP, `request`, `response` ou status codes.

## Controllers

Orquestram casos de uso, validações de negócio e transações. Recebem dados simples/dependências e retornam resultados ou erros de domínio. Não registram rotas nem iniciam servidor.

## Views/Routes

São adaptadores HTTP finos: extraem entrada, chamam controller, serializam saída e escolhem status. Não executam SQL nem concentram regra de negócio.

## Serviços e middlewares

Integrações externas e operações transversais ficam em serviços injetáveis. Erros são convertidos de forma centralizada, sem vazar stack traces, segredos ou mensagens internas.

## Compatibilidade

Preserve contrato HTTP. Prefira factory (`create_app`, `createApp`) para testes. Feche recursos e use bancos temporários/in-memory em testes. A estrutura pode variar por linguagem, mas as responsabilidades não.
