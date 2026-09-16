# ADR-004 — HMAC-SHA256 por endpoint

## Status
Aceito — 09/09/2026.

## Contexto
Eventos de pedido saem da infraestrutura e o receptor precisa provar origem e integridade. Uma secret única global ampliaria o impacto de um vazamento.

## Decisão
Assinar o corpo com HMAC-SHA256 e enviar em `X-Signature`. Cada endpoint guarda sua secret; rotação mantém a anterior válida por 24 horas. Aceitar apenas URLs HTTPS e rejeitar payload acima de 64 KB sem truncar.

## Alternativas Consideradas
- Secret global: descartada porque um vazamento comprometeria todos os clientes.
- Sem assinatura/TLS opcional: descartado por não permitir validação de origem/integridade.

## Consequências
Positivas: integradores conseguem validar mensagens e isolar credenciais. Negativas: geração, armazenamento, redação em logs e revisão de segurança exigem cuidado; rotação adiciona estado temporário.
