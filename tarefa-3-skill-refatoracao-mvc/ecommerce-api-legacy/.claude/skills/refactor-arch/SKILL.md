---
name: refactor-arch
description: Analisa, audita e refatora aplicações backend legadas para MVC, preservando contratos HTTP e validando boot e endpoints. Use quando o usuário pedir auditoria arquitetural, identificação de code smells ou migração segura para MVC.
---

# Refactor Arch

Execute as fases abaixo em ordem. Trabalhe de forma agnóstica de linguagem: identifique primeiro a stack e adapte ferramentas, nomes e comandos ao projeto real.

## Regras invariantes

- Preserve métodos, paths, códigos HTTP e formatos de resposta públicos, salvo autorização explícita.
- Registre cada finding com arquivo e linha verificados no código anterior à refatoração.
- Não modifique arquivos antes da confirmação exigida ao fim da Fase 2.
- Não alegue sucesso sem executar validação observável.
- Preserve mudanças preexistentes e segredos fora do controle de versão.

## Fase 1 — Análise

Leia [references/project-analysis.md](references/project-analysis.md). Inventarie arquivos relevantes, manifests, entrypoints, rotas, persistência e testes. Imprima um resumo com linguagem, framework e versão, dependências principais, domínio, arquitetura atual, arquivos analisados e entidades/tabelas.

## Fase 2 — Auditoria

Leia [references/anti-patterns.md](references/anti-patterns.md) e [references/audit-report-template.md](references/audit-report-template.md). Cruze evidências do código com o catálogo, valide as linhas e gere o relatório no formato exigido. Ordene por `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` e indique APIs deprecated quando aplicável.

Ao terminar, pare e pergunte exatamente se deve prosseguir com a Fase 3. Não edite, mova ou exclua arquivos antes de uma resposta afirmativa.

## Fase 3 — Refatoração

Após confirmação, leia [references/mvc-guidelines.md](references/mvc-guidelines.md) e [references/refactoring-playbook.md](references/refactoring-playbook.md). Faça mudanças incrementais e rastreáveis:

1. Capture o comportamento atual com smoke tests ou testes de contrato.
2. Extraia configuração e composition root.
3. Separe Models/repositórios, Controllers e Views/Routes.
4. Centralize validação e tratamento de erros.
5. Elimine vulnerabilidades e smells confirmados sem quebrar o contrato.
6. Execute testes, boot real e chamadas aos endpoints principais.

Apresente a nova árvore e a validação executada, incluindo comandos, resultados e qualquer limitação remanescente.
