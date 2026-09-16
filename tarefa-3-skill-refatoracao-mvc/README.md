# Tarefa 3 — Skill de Auditoria e Refatoração MVC

Skill agnóstica de tecnologia para analisar, auditar e refatorar aplicações backend para MVC. A implementação foi validada em duas APIs Python/Flask e uma API Node.js/Express, preservando seus endpoints.

## Estrutura

```text
.
├── code-smells-project/          # Flask e SQLite — e-commerce
├── ecommerce-api-legacy/         # Express e SQLite — LMS/checkout
├── task-manager-api/             # Flask-SQLAlchemy — tarefas
├── reports/
│   ├── audit-project-1.md
│   ├── audit-project-2.md
│   └── audit-project-3.md
└── README.md
```

Cada projeto contém uma cópia completa de `.claude/skills/refactor-arch/`, composta por `SKILL.md` e cinco referências Markdown.

## Análise Manual

As linhas abaixo referem-se ao código legado antes da Fase 3. Os relatórios em `reports/` trazem evidência, impacto e recomendação para cada finding.

### Projeto 1 — code-smells-project

| Severidade | Problema | Evidência original | Relevância |
| --- | --- | --- | --- |
| CRITICAL | SQL injection | `models.py:28-29,47-50,109-111,289-299` | Input externo era concatenado ao SQL. |
| CRITICAL | Console SQL público | `app.py:59-78` | Permitiria executar comandos arbitrários. |
| CRITICAL | Segredo exposto | `app.py:7`, `controllers.py:264-290` | A chave estava no fonte e no health check. |
| HIGH | Admin sem autorização | `app.py:47-78` | Reset e query podiam ser chamados anonimamente. |
| MEDIUM | Query N+1 | `models.py:171-233` | Consultas em loops aumentavam com cada pedido. |
| MEDIUM | Validação duplicada | `controllers.py:24-96,146-201` | Regras inconsistentes e difíceis de testar. |
| LOW | Magic values | `controllers.py:52,242` | Categorias e status estavam espalhados. |
| LOW | Logging por `print` | `controllers.py:8,57,161,179` | Observabilidade não estruturada. |

### Projeto 2 — ecommerce-api-legacy

| Severidade | Problema | Evidência original | Relevância |
| --- | --- | --- | --- |
| CRITICAL | Credenciais hardcoded | `src/utils.js:1-6` | Senha e chave live estavam versionadas. |
| CRITICAL | Cartão nos logs | `src/AppManager.js:43-46` | Exposição de dados financeiros. |
| HIGH | God Class | `src/AppManager.js:4-138` | Rotas, banco, pagamento e relatório na mesma classe. |
| HIGH | Hash caseiro | `src/utils.js:17-23` | Base64 curto e determinístico não protege senhas. |
| MEDIUM | Checkout não atômico | `src/AppManager.js:50-61` | Falhas deixavam gravações parciais. |
| MEDIUM | Query N+1 | `src/AppManager.js:80-129` | Relatório executava consultas aninhadas. |
| LOW | Nomes opacos | `src/AppManager.js:29-33` | `u`, `e`, `p`, `cid` e `cc` reduziam clareza. |
| LOW | Estado/código morto | `src/utils.js:9-10,25` | Cache global e receita não utilizada. |

### Projeto 3 — task-manager-api

| Severidade | Problema | Evidência original | Relevância |
| --- | --- | --- | --- |
| CRITICAL | Credencial SMTP fixa | `services/notification_service.py:7-10` | Conta de e-mail exposta. |
| CRITICAL | MD5 e senha serializada | `models/user.py:16-32` | Credenciais eram frágeis e retornadas na API. |
| HIGH | Chave fixa/debug | `app.py:11-14,34` | Configuração insegura em runtime. |
| HIGH | Token previsível | `routes/user_routes.py:185-211` | Identidade podia ser forjada. |
| MEDIUM | N+1 em tarefas | `routes/task_routes.py:11-59` | Usuário/categoria consultados por tarefa. |
| MEDIUM | API deprecated | múltiplos `Model.query.get` | Incompatibilidade futura com SQLAlchemy 2. |
| LOW | Imports mortos | `routes/task_routes.py:7`, `utils/helpers.py:3-7` | Ruído e dependências falsas. |
| LOW | Magic values duplicados | `routes/task_routes.py:96-114` | Regras repetidas apesar de constantes existentes. |

## Construção da Skill

O `SKILL.md` contém somente o fluxo e os invariantes compartilhados. Conhecimento detalhado foi separado para carregamento progressivo:

- `project-analysis.md`: detecção de linguagem, framework, banco, domínio e arquitetura;
- `anti-patterns.md`: 14 padrões distribuídos entre CRITICAL, HIGH, MEDIUM e LOW, incluindo APIs deprecated;
- `audit-report-template.md`: formato determinístico com arquivo e linhas;
- `mvc-guidelines.md`: responsabilidades de composition root, Models, Controllers, Views/Routes, serviços e middlewares;
- `refactoring-playbook.md`: 10 transformações com exemplos antes/depois.

A tecnologia é detectada antes da auditoria. As regras descrevem responsabilidades e resultados, não bibliotecas específicas. Por isso a mesma skill orienta Flask/SQLite, Express/SQLite e Flask-SQLAlchemy. A Fase 2 contém um gate explícito que impede qualquer escrita antes da confirmação.

### Decisões de refatoração

- App factories permitem boot isolado em testes.
- Configuração e segredos vêm do ambiente.
- Persistência usa parâmetros e transações.
- Routes/Views registram os contratos HTTP; Controllers orquestram o fluxo.
- Password hashing usa as bibliotecas seguras da plataforma.
- Erros inesperados são tratados centralmente sem vazar detalhes.
- O Node substituiu callbacks/N+1 por Promises, transação e consulta agregada.
- O Task Manager preservou Models e Services úteis e recebeu config, controllers, views e middleware.

## Resultados

### Resumo das auditorias

| Projeto | CRITICAL | HIGH | MEDIUM | LOW | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| code-smells-project | 4 | 2 | 2 | 2 | 10 |
| ecommerce-api-legacy | 2 | 2 | 2 | 2 | 8 |
| task-manager-api | 2 | 2 | 3 | 2 | 9 |

### Antes e depois

| Projeto | Antes | Depois |
| --- | --- | --- |
| E-commerce Flask | quatro módulos, conexão global e SQL concatenado | `src/config`, `models`, `controllers`, `views`, `middlewares` e app factory |
| LMS Express | `AppManager` com todas as responsabilidades | config, database/repositories, services, controllers, routes e middleware |
| Task Manager Flask | blueprints com regras extensas e config fixa | app factory, config, controllers por domínio, views, middleware e services seguros |

### Checklist de validação

#### Projeto 1

- [x] Python/Flask e domínio e-commerce detectados
- [x] 4 arquivos e 780 linhas originais inventariados
- [x] 10 findings ordenados, com linhas exatas
- [x] Gate entre Fases 2 e 3 documentado
- [x] Estrutura MVC, config, Models, Controllers, Views e error handler criados
- [x] Boot e endpoints de health, leitura, escrita e administração validados

#### Projeto 2

- [x] Node.js/Express e domínio LMS/checkout detectados
- [x] 3 arquivos e 180 linhas originais inventariados
- [x] 8 findings ordenados, com linhas exatas
- [x] Gate entre Fases 2 e 3 documentado
- [x] Estrutura MVC, services, transações e error handler criados
- [x] Boot e endpoints de checkout, relatório, health e administração validados

#### Projeto 3

- [x] Python/Flask-SQLAlchemy e domínio Task Manager detectados
- [x] 15 arquivos e 1.158 linhas originais inventariados
- [x] 9 findings ordenados, incluindo API deprecated
- [x] Gate entre Fases 2 e 3 documentado
- [x] Config, Controllers, Views, Models, Services e error handler organizados
- [x] Boot e endpoints de tasks, users, reports e health validados

Os logs reproduzíveis são gerados pelos comandos de teste abaixo. A skill se comportou da mesma forma nas duas linguagens porque suas referências usam evidências e responsabilidades arquiteturais, deixando a escolha de implementação para a stack detectada.

- [Log consolidado da validação](reports/validation-results.md)

## Como Executar

### Pré-requisitos

- OpenAI Codex instalado e autenticado
- Python 3.9+
- Node.js 18+

O projeto conserva `.claude/skills/refactor-arch/` em cada aplicação para cumprir a estrutura solicitada. No Codex, informe explicitamente o caminho da skill e o projeto alvo:

```bash
cd code-smells-project
codex "Use a skill refactor-arch em .claude/skills/refactor-arch para analisar, auditar e, após minha confirmação, refatorar este projeto."
```

Repita em `ecommerce-api-legacy` e `task-manager-api`. A Fase 2 sempre solicita confirmação antes da Fase 3.

### Validar o projeto 1

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt pytest
pytest -q
python app.py
```

### Validar o projeto 2

```bash
npm ci
npm test
npm start
```

### Validar o projeto 3

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt pytest
pytest -q
python app.py
```

Variáveis relevantes: `SECRET_KEY`, `DATABASE_PATH`/`DATABASE_URI`, `ADMIN_TOKEN`, `PAYMENT_GATEWAY_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` e `SMTP_PASSWORD`. Arquivos `.env`, bancos, ambientes virtuais e `node_modules` não são versionados.

## Relatórios completos

- [Projeto 1](reports/audit-project-1.md)
- [Projeto 2](reports/audit-project-2.md)
- [Projeto 3](reports/audit-project-3.md)

Referência da ferramenta escolhida: [documentação oficial do OpenAI Codex](https://developers.openai.com/codex/).
