# Catálogo de anti-patterns

Use a maior severidade sustentada pela evidência e pelo impacto real.

| Severidade | Anti-pattern | Sinais verificáveis | Correção esperada |
| --- | --- | --- | --- |
| CRITICAL | SQL/command injection | concatenação de input em SQL ou shell | parâmetros/bindings e allowlists |
| CRITICAL | Credenciais ou segredos hardcoded | senha, token, secret key ou chave live no fonte | variáveis de ambiente e falha segura |
| CRITICAL | God Class/God Method | módulo controla HTTP, domínio, banco e integrações | separar MVC e serviços |
| HIGH | Criptografia inadequada | MD5, SHA simples, Base64 ou algoritmo caseiro para senhas | função de password hashing da stack |
| HIGH | Autorização ausente | endpoint administrativo/destrutivo sem controle | autenticação e autorização explícitas |
| HIGH | Acoplamento/estado global mutável | singleton de conexão/cache ou dependência instanciada globalmente | factory e injeção de dependência |
| HIGH | Transação não atômica | fluxo grava várias tabelas sem rollback | transação com commit/rollback único |
| MEDIUM | Query N+1 | consulta dentro de loop por entidade | join, eager loading ou consulta agregada |
| MEDIUM | Validação ausente/inconsistente | body ou parâmetros usados sem tipo/faixa/formato | schema/validator centralizado |
| MEDIUM | Tratamento de erro disperso | `except`/callbacks ignoram erro ou vazam detalhes | middleware/handler centralizado |
| MEDIUM | API deprecated | símbolos marcados deprecated pela versão instalada, como `Query.get` no SQLAlchemy 2 | equivalente moderno documentado |
| LOW | Duplicação | serialização, validação ou condições repetidas | helper ou método de domínio |
| LOW | Nomes opacos/magic values | `u`, `e`, números e strings repetidos | nomes semânticos e constantes |
| LOW | Imports/código morto | imports e variáveis nunca usados | remover após testes |

Não marque uma API como deprecated por memória: confirme a versão instalada/declarada e a documentação ou aviso da própria ferramenta.
