import hmac

CATEGORIES = {"informatica", "moveis", "vestuario", "geral", "eletronicos", "livros"}
STATUSES = {"pendente", "aprovado", "enviado", "entregue", "cancelado"}


class ProductController:
    def __init__(self, repository): self.repository = repository
    def list(self): return {"dados": self.repository.list(), "sucesso": True}, 200
    def get(self, product_id):
        product = self.repository.get(product_id)
        return ({"dados": product, "sucesso": True}, 200) if product else ({"erro": "Produto não encontrado", "sucesso": False}, 404)
    def save(self, payload, product_id=None):
        if not payload or any(key not in payload for key in ("nome", "preco", "estoque")): return {"erro": "Nome, preço e estoque são obrigatórios"}, 400
        try: data = {"nome": str(payload["nome"]).strip(), "descricao": str(payload.get("descricao", "")), "preco": float(payload["preco"]), "estoque": int(payload["estoque"]), "categoria": payload.get("categoria", "geral")}
        except (TypeError, ValueError): return {"erro": "Preço ou estoque inválido"}, 400
        if not 2 <= len(data["nome"]) <= 200 or data["preco"] < 0 or data["estoque"] < 0 or data["categoria"] not in CATEGORIES: return {"erro": "Dados do produto inválidos"}, 400
        if product_id is not None:
            if not self.repository.get(product_id): return {"erro": "Produto não encontrado"}, 404
            self.repository.update(product_id, data); return {"sucesso": True, "mensagem": "Produto atualizado"}, 200
        product_id = self.repository.create(data); return {"dados": {"id": product_id}, "sucesso": True, "mensagem": "Produto criado"}, 201
    def delete(self, product_id):
        if not self.repository.get(product_id): return {"erro": "Produto não encontrado"}, 404
        self.repository.delete(product_id); return {"sucesso": True, "mensagem": "Produto deletado"}, 200
    def search(self, args):
        try: minimum = float(args["preco_min"]) if args.get("preco_min") else None; maximum = float(args["preco_max"]) if args.get("preco_max") else None
        except ValueError: return {"erro": "Faixa de preço inválida"}, 400
        data = self.repository.search(args.get("q", ""), args.get("categoria"), minimum, maximum); return {"dados": data, "total": len(data), "sucesso": True}, 200


class UserController:
    def __init__(self, repository): self.repository = repository
    def list(self): return {"dados": self.repository.list(), "sucesso": True}, 200
    def get(self, user_id):
        user = self.repository.get(user_id); return ({"dados": user, "sucesso": True}, 200) if user else ({"erro": "Usuário não encontrado"}, 404)
    def create(self, payload):
        if not payload or not all(payload.get(key) for key in ("nome", "email", "senha")): return {"erro": "Nome, email e senha são obrigatórios"}, 400
        return {"dados": {"id": self.repository.create(payload["nome"], payload["email"], payload["senha"])}, "sucesso": True}, 201
    def login(self, payload):
        if not payload or not payload.get("email") or not payload.get("senha"): return {"erro": "Email e senha são obrigatórios"}, 400
        user = self.repository.authenticate(payload["email"], payload["senha"]); return ({"dados": user, "sucesso": True, "mensagem": "Login OK"}, 200) if user else ({"erro": "Email ou senha inválidos", "sucesso": False}, 401)


class OrderController:
    def __init__(self, repository): self.repository = repository
    def create(self, payload):
        if not payload or not payload.get("usuario_id") or not payload.get("itens"): return {"erro": "Usuario ID e itens são obrigatórios"}, 400
        try: return {"dados": self.repository.create(payload["usuario_id"], payload["itens"]), "sucesso": True, "mensagem": "Pedido criado com sucesso"}, 201
        except (KeyError, TypeError, ValueError) as error: return {"erro": str(error), "sucesso": False}, 400
    def list(self, user_id=None): return {"dados": self.repository.list(user_id), "sucesso": True}, 200
    def update_status(self, order_id, payload):
        status = (payload or {}).get("status")
        if status not in STATUSES: return {"erro": "Status inválido"}, 400
        self.repository.update_status(order_id, status); return {"sucesso": True, "mensagem": "Status atualizado"}, 200
    def report(self): return {"dados": self.repository.report(), "sucesso": True}, 200


class AdminController:
    def __init__(self, database, token): self.database, self.token = database, token
    def authorized(self, supplied): return bool(self.token and supplied and hmac.compare_digest(self.token, supplied))
    def reset(self, supplied):
        if not self.authorized(supplied): return {"erro": "Não autorizado"}, 403
        with self.database.transaction() as db:
            for table in ("itens_pedido", "pedidos", "produtos", "usuarios"): db.execute(f"DELETE FROM {table}")
        return {"mensagem": "Banco de dados resetado", "sucesso": True}, 200
    def query(self, supplied, payload):
        if not self.authorized(supplied): return {"erro": "Não autorizado"}, 403
        query = (payload or {}).get("sql", "").strip()
        if not query.upper().startswith("SELECT") or ";" in query: return {"erro": "Somente consultas SELECT simples são permitidas"}, 400
        with self.database.connect() as db: return {"dados": [dict(row) for row in db.execute(query).fetchall()], "sucesso": True}, 200
