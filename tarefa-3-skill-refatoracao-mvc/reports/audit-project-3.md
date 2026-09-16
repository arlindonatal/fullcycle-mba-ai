# Architecture Audit Report — task-manager-api

## Project Analysis
- Language: Python 3.9+
- Framework: Flask 3.0.0 + Flask-SQLAlchemy 3.1.1
- Domain: gestão de tarefas, usuários, categorias e relatórios
- Architecture: camadas parciais; routes ainda acumulam controller e regra de negócio
- Source files: 15 arquivos Python, 1.158 linhas no estado original
- Database: SQLite/SQLAlchemy; `tasks`, `users`, `categories`

## Summary
| Severity | Count |
| --- | ---: |
| CRITICAL | 2 |
| HIGH | 2 |
| MEDIUM | 3 |
| LOW | 2 |

## Findings

### [CRITICAL] Credenciais SMTP hardcoded
- **File:** `services/notification_service.py:7-10`
- **Evidence:** usuário e senha de e-mail constam no fonte.
- **Impact:** tomada da conta e abuso do serviço.
- **Recommendation:** carregar ambiente e permitir transporte injetável.

### [CRITICAL] Hash MD5 e senha exposta na API
- **File:** `models/user.py:16-32`
- **Evidence:** `to_dict` inclui password e autenticação usa MD5 sem salt.
- **Impact:** exposição e quebra rápida das senhas.
- **Recommendation:** Werkzeug password hashing e DTO público.

### [HIGH] Chave de aplicação hardcoded e debug ativo
- **File:** `app.py:11-14,34`
- **Evidence:** SECRET_KEY fixa e servidor iniciado com debug.
- **Impact:** falsificação de sessão e exposição de debugger.
- **Recommendation:** módulo de configuração por ambiente e default seguro.

### [HIGH] Token de login falso e previsível
- **File:** `routes/user_routes.py:185-211`
- **Evidence:** token é a string `fake-jwt-token-<id>`.
- **Impact:** qualquer usuário pode forjar identidade.
- **Recommendation:** token assinado/expirável e autorização nos endpoints.

### [MEDIUM] Query N+1 na listagem de tarefas
- **File:** `routes/task_routes.py:11-59`
- **Evidence:** usuário e categoria são buscados por item.
- **Impact:** duas consultas adicionais por tarefa.
- **Recommendation:** eager loading/joinedload.

### [MEDIUM] Query N+1 no relatório por usuário
- **File:** `routes/report_routes.py:53-68`
- **Evidence:** tarefas são consultadas dentro do loop de usuários.
- **Impact:** degradação proporcional ao número de usuários.
- **Recommendation:** agregação no banco.

### [MEDIUM] Uso de API deprecated do SQLAlchemy
- **File:** `routes/task_routes.py:67,117,122,158,188,195,227; routes/user_routes.py:29,94,136,155; routes/report_routes.py:105,192,213`
- **Evidence:** `Model.query.get` é legado no SQLAlchemy 2.x.
- **Impact:** warnings e risco de incompatibilidade futura.
- **Recommendation:** `db.session.get(Model, id)`.

### [LOW] Imports não utilizados
- **File:** `routes/task_routes.py:7; routes/user_routes.py:6; utils/helpers.py:3-7`
- **Evidence:** módulos são importados sem uso.
- **Impact:** ruído e dependências aparentes falsas.
- **Recommendation:** remover imports mortos.

### [LOW] Constantes duplicadas e magic values
- **File:** `routes/task_routes.py:96-114,166-184; utils/helpers.py:110-116`
- **Evidence:** regras são repetidas apesar de constantes existentes.
- **Impact:** divergência futura entre validações.
- **Recommendation:** validator compartilhado e constantes únicas.

## Refactoring Plan
1. Criar app factory e configuração externa.
2. Organizar fluxo em controllers e views; manter models/services úteis.
3. Corrigir password hashing, serialização, token e SMTP.
4. Migrar APIs deprecated e centralizar erros.
5. Validar boot e endpoints de tasks, users e reports.

## Phase 2 Gate
Nenhum arquivo foi modificado durante a auditoria. A Fase 3 foi confirmada pelo solicitante e executada.
