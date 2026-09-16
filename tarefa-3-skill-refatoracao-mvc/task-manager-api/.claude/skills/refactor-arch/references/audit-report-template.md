# Template do relatório

```markdown
# Architecture Audit Report — <projeto>

## Project Analysis
- Language: <linguagem e versão>
- Framework: <framework e versão>
- Domain: <domínio>
- Architecture: <estado atual>
- Source files: <quantidade e linhas>
- Database: <tecnologia e entidades>

## Summary
| Severity | Count |
| --- | ---: |
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 0 |

## Findings

### [CRITICAL] <título>
- **File:** `path:linha-inicial-linha-final`
- **Evidence:** <fato observável>
- **Impact:** <risco concreto>
- **Recommendation:** <mudança verificável>

## Refactoring Plan
1. <passo incremental>

## Phase 2 Gate
Nenhum arquivo foi modificado nesta fase. Prosseguir com a Fase 3? [y/n]
```

Use caminhos relativos ao projeto e linhas do estado auditado. Não misture correções já aplicadas aos achados originais. Ordene findings por severidade e, dentro dela, por impacto.
