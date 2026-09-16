# Playbook de refatoração

Execute apenas padrões sustentados pelos findings. Cada exemplo é conceitual e deve ser adaptado à stack.

## 1. SQL concatenado -> query parametrizada

Antes: `db.execute("SELECT * FROM users WHERE id=" + id)`

Depois: `db.execute("SELECT * FROM users WHERE id = ?", [id])`

## 2. Segredo no fonte -> configuração de ambiente

Antes: `SECRET_KEY = "prod-secret"`

Depois: `SECRET_KEY = env.require("SECRET_KEY")`

## 3. God Class -> MVC

Antes: `AppManager` registra rota, consulta DB e cobra cartão.

Depois: `checkoutRoute -> checkoutController -> repositories/paymentService`.

## 4. Hash caseiro -> password hasher da plataforma

Antes: `md5(password)` ou Base64 repetido.

Depois: `generate_password_hash(password)` / `scrypt` com salt e comparação segura.

## 5. Estado global -> dependency injection

Antes: `global dbConnection`.

Depois: `createApp({ repository })` ou conexão vinculada ao contexto da requisição.

## 6. N+1 -> consulta agregada/eager loading

Antes: `for item in items: query(item.id)`.

Depois: uma query com `JOIN` ou eager loading e agrupamento em memória.

## 7. Erros dispersos -> handler central

Antes: cada rota captura `Exception` e devolve detalhes.

Depois: controller lança erro tipado; middleware mapeia para resposta estável e registra detalhes internamente.

## 8. Validação duplicada -> validator/schema

Antes: vários blocos `if field not in body`.

Depois: `validateCreatePayload(body)` retorna dados normalizados ou erro consistente.

## 9. Escritas parciais -> transação

Antes: criar pedido, itens e estoque com commits independentes.

Depois: `BEGIN`; execute todas as etapas; `COMMIT`; em falha, `ROLLBACK`.

## 10. API deprecated -> equivalente moderno

Antes (SQLAlchemy 2): `Model.query.get(id)`.

Depois: `db.session.get(Model, id)`.

## Validação obrigatória

1. Execute lint/compilação quando disponível.
2. Execute testes automatizados.
3. Inicie a aplicação com configuração de teste.
4. Chame health e pelo menos um endpoint de leitura e um de escrita por domínio crítico.
5. Compare métodos, paths, status e campos essenciais com o contrato anterior.
