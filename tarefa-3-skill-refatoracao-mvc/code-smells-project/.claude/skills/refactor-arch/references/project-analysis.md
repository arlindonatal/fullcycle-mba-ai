# Análise de projeto

## Inventário

1. Liste manifests e locks (`requirements*.txt`, `pyproject.toml`, `package.json`, locks).
2. Conte somente fontes próprios; exclua `.git`, ambientes virtuais, dependências, builds e caches.
3. Localize entrypoints, criação do servidor, registro de rotas, configuração, acesso a dados e testes.
4. Mapeie fluxo `requisição -> rota/view -> controller -> model/repositório -> banco`.

## Detecção de stack

- Python: `.py`, `requirements.txt`, `pyproject.toml`. Flask: imports `flask`, `Flask`, `Blueprint`; versão pelo manifest ou ambiente.
- Node.js: `package.json`, `.js`, `.mjs`, `.ts`. Express: dependência/import `express`; versão pelo lock.
- Banco: imports/drivers, URI de conexão, migrations, DDL e nomes de tabelas.
- Domínio: derive de recursos e rotas, nunca apenas do nome da pasta.

## Classificação da arquitetura

- Monolítica: roteamento, regra de negócio e persistência no mesmo módulo/classe.
- Camadas parciais: há pastas, mas as responsabilidades atravessam fronteiras.
- MVC: routes/views traduzem HTTP; controllers orquestram casos de uso; models/repositórios tratam domínio e dados.

## Saída da Fase 1

Informe: Language, Framework, Dependencies, Domain, Architecture, Source files analyzed, entrypoint, database e tabelas/entidades. Cite como cada conclusão foi verificada.
