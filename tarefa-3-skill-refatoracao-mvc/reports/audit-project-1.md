# Architecture Audit Report — code-smells-project

## Project Analysis
- Language: Python 3.9+
- Framework: Flask 3.1.1
- Domain: API de e-commerce para produtos, usuários, pedidos e vendas
- Architecture: monolítica, com quatro módulos e responsabilidades misturadas
- Source files: 4 arquivos, 780 linhas no estado original
- Database: SQLite; `produtos`, `usuarios`, `pedidos`, `itens_pedido`

## Summary
| Severity | Count |
| --- | ---: |
| CRITICAL | 4 |
| HIGH | 2 |
| MEDIUM | 2 |
| LOW | 2 |

## Findings

### [CRITICAL] SQL injection em operações de produto, usuário, pedido e busca
- **File:** `models.py:28-29,47-50,109-111,126-129,289-299`
- **Evidence:** valores de rota/body são concatenados diretamente ao SQL.
- **Impact:** leitura, alteração ou exclusão arbitrária de dados.
- **Recommendation:** queries parametrizadas e filtros construídos por allowlist.

### [CRITICAL] Endpoint permite SQL arbitrário
- **File:** `app.py:59-78`
- **Evidence:** `/admin/query` executa texto SQL fornecido pelo cliente sem autenticação.
- **Impact:** comprometimento integral do banco.
- **Recommendation:** remover a função ou restringir a SELECT parametrizada com autenticação administrativa.

### [CRITICAL] Segredo hardcoded e exposto pelo health check
- **File:** `app.py:7, controllers.py:264-290`
- **Evidence:** `SECRET_KEY` está no fonte e é devolvida na resposta HTTP.
- **Impact:** falsificação de sessões e exposição operacional.
- **Recommendation:** configuração por ambiente e health check mínimo.

### [CRITICAL] Senhas em texto claro e incluídas nas respostas
- **File:** `database.py:75-82, models.py:72-103`
- **Evidence:** seeds e tabela armazenam senha sem hash; serializers devolvem o campo.
- **Impact:** vazamento imediato das credenciais.
- **Recommendation:** password hashing adaptativo e DTO público sem senha.

### [HIGH] Ausência de autorização nos endpoints administrativos
- **File:** `app.py:47-78`
- **Evidence:** reset e console SQL são públicos.
- **Impact:** perda de dados por chamada não autorizada.
- **Recommendation:** autenticação, papel administrativo e comparação segura de token.

### [HIGH] Conexão global mutável e transação de pedido acoplada
- **File:** `database.py:4-11, models.py:133-169`
- **Evidence:** conexão singleton compartilhada e fluxo de pedido sem abstração de transação.
- **Impact:** baixa testabilidade e risco de inconsistência sob concorrência.
- **Recommendation:** conexão por contexto/repositório e transação atômica.

### [MEDIUM] Queries N+1 na listagem de pedidos
- **File:** `models.py:171-233`
- **Evidence:** itens e produtos são consultados dentro de loops de pedidos.
- **Impact:** crescimento explosivo de consultas.
- **Recommendation:** JOIN único e agrupamento do resultado.

### [MEDIUM] Validação duplicada nos controllers
- **File:** `controllers.py:24-96,146-201`
- **Evidence:** validações de payload e faixas são repetidas e inconsistentes.
- **Impact:** respostas divergentes e manutenção arriscada.
- **Recommendation:** validators reutilizáveis e controllers menores.

### [LOW] Magic values de categorias e status
- **File:** `controllers.py:52,242`
- **Evidence:** listas literais repetidas no fluxo.
- **Impact:** alterações propensas a erro.
- **Recommendation:** constantes de domínio.

### [LOW] Logs com dados operacionais via `print`
- **File:** `controllers.py:8,57,161,179,208-210`
- **Evidence:** saída não estruturada espalhada pelos casos de uso.
- **Impact:** observabilidade e filtragem deficientes.
- **Recommendation:** logger estruturado e mensagens sem dados sensíveis.

## Refactoring Plan
1. Criar app factory, configuração e banco injetável.
2. Separar repositories, controllers, routes e error handler.
3. Parametrizar SQL, aplicar hashing e remover dados sensíveis.
4. Proteger endpoints administrativos e tornar pedido atômico.
5. Validar boot e contratos HTTP com testes.

## Phase 2 Gate
Nenhum arquivo foi modificado durante a auditoria. A Fase 3 foi confirmada pelo solicitante e executada.
