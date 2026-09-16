# Validation Results

Execução local realizada em 16 de setembro de 2026 após a Fase 3.

## Skill

O validador oficial do pacote `skill-creator` foi executado nas três cópias:

```text
Skill is valid!
Skill is valid!
Skill is valid!
```

## Projeto 1 — Flask e SQLite

Comando: `venv/bin/python -m pytest -q`

```text
.                                                                        [100%]
1 passed in 0.08s
```

Contratos cobertos: boot pela app factory, `GET /health`, `GET /produtos`, `POST /produtos` e bloqueio de `POST /admin/query` sem autorização.

## Projeto 2 — Express e SQLite

Comandos: `npm audit --audit-level=moderate` e `npm test`.

```text
found 0 vulnerabilities
✔ boot, health and checkout contracts
tests 1 | pass 1 | fail 0
```

Contratos cobertos: boot assíncrono, `GET /health`, `POST /api/checkout`, `GET /api/admin/financial-report` e bloqueio de `DELETE /api/users/:id` sem autorização.

## Projeto 3 — Flask-SQLAlchemy

Comando: `venv/bin/python -m pytest -q`

```text
.                                                                        [100%]
1 passed in 0.34s
```

Contratos cobertos: boot pela app factory, `GET /health`, `GET /tasks`, `GET /users`, `GET /reports/summary`, `POST /users` e ausência do hash da senha na resposta.

## Resultado

As três aplicações iniciaram em configuração de teste e todos os endpoints selecionados responderam com os status esperados. Os testes usam bancos temporários ou em memória e não dependem de dados persistentes locais.
