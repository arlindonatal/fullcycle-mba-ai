# Architecture Audit Report — ecommerce-api-legacy

## Project Analysis
- Language: JavaScript / Node.js
- Framework: Express 4.18.2
- Domain: LMS/e-commerce com checkout, matrículas, pagamentos e relatório financeiro
- Architecture: God Class com rotas, persistência e regras na mesma classe
- Source files: 3 arquivos JavaScript, 180 linhas no estado original
- Database: SQLite; `users`, `courses`, `enrollments`, `payments`, `audit_logs`

## Summary
| Severity | Count |
| --- | ---: |
| CRITICAL | 2 |
| HIGH | 2 |
| MEDIUM | 2 |
| LOW | 2 |

## Findings

### [CRITICAL] Credenciais e chave live hardcoded
- **File:** `src/utils.js:1-6`
- **Evidence:** usuário, senha e `paymentGatewayKey` estão versionados.
- **Impact:** comprometimento de banco e gateway.
- **Recommendation:** variáveis de ambiente sem defaults secretos.

### [CRITICAL] Dados completos do cartão são registrados
- **File:** `src/AppManager.js:43-46`
- **Evidence:** o número recebido é interpolado em `console.log`.
- **Impact:** exposição de dados financeiros e não conformidade.
- **Recommendation:** nunca registrar PAN; manter apenas últimos quatro dígitos quando necessário.

### [HIGH] God Class concentra todas as camadas
- **File:** `src/AppManager.js:4-138`
- **Evidence:** uma classe cria schema, registra rotas, valida, cobra, grava e gera relatório.
- **Impact:** impossível testar casos de uso isoladamente.
- **Recommendation:** controllers, repositories, services e routes separados.

### [HIGH] Algoritmo caseiro de senha
- **File:** `src/utils.js:17-23`
- **Evidence:** Base64 repetido produz hash curto e determinístico.
- **Impact:** senhas recuperáveis por ataque trivial.
- **Recommendation:** `crypto.scrypt` com salt ou biblioteca especializada.

### [MEDIUM] Checkout sem transação atômica
- **File:** `src/AppManager.js:50-61`
- **Evidence:** matrícula, pagamento e auditoria são inserts encadeados sem rollback.
- **Impact:** registros parciais em falhas intermediárias.
- **Recommendation:** transação única.

### [MEDIUM] N+1 no relatório financeiro
- **File:** `src/AppManager.js:80-129`
- **Evidence:** cursos, matrículas, usuários e pagamentos são consultados em loops aninhados.
- **Impact:** latência e carga crescem com o volume.
- **Recommendation:** query agregada com JOIN/GROUP BY.

### [LOW] Nomes opacos no checkout
- **File:** `src/AppManager.js:29-33`
- **Evidence:** `u`, `e`, `p`, `cid`, `cc` ocultam o significado.
- **Impact:** reduz legibilidade e facilita erros.
- **Recommendation:** nomes semânticos no boundary do controller.

### [LOW] Estado global e export não utilizado
- **File:** `src/utils.js:9-10,25`
- **Evidence:** cache e receita globais, sendo `totalRevenue` importado sem uso.
- **Impact:** estado imprevisível e ruído.
- **Recommendation:** remover código morto e injetar cache quando necessário.

## Refactoring Plan
1. Introduzir `createApp` assíncrono e configuração externa.
2. Separar database/repositories, controllers, services, views/routes e middleware.
3. Aplicar scrypt, mascarar cartão e transação de checkout.
4. Substituir N+1 por query agregada.
5. Validar todos os endpoints originais com teste HTTP.

## Phase 2 Gate
Nenhum arquivo foi modificado durante a auditoria. A Fase 3 foi confirmada pelo solicitante e executada.
