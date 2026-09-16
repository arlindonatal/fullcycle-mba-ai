from werkzeug.security import check_password_hash, generate_password_hash


class ProductRepository:
    def __init__(self, database): self.database = database
    def list(self):
        with self.database.connect() as db: return [dict(row) for row in db.execute("SELECT * FROM produtos").fetchall()]
    def get(self, product_id):
        with self.database.connect() as db:
            row = db.execute("SELECT * FROM produtos WHERE id = ?", (product_id,)).fetchone()
            return dict(row) if row else None
    def create(self, data):
        with self.database.transaction() as db:
            return db.execute("INSERT INTO produtos (nome, descricao, preco, estoque, categoria) VALUES (?, ?, ?, ?, ?)", (data["nome"], data["descricao"], data["preco"], data["estoque"], data["categoria"])).lastrowid
    def update(self, product_id, data):
        with self.database.transaction() as db: db.execute("UPDATE produtos SET nome=?, descricao=?, preco=?, estoque=?, categoria=? WHERE id=?", (data["nome"], data["descricao"], data["preco"], data["estoque"], data["categoria"], product_id))
    def delete(self, product_id):
        with self.database.transaction() as db: db.execute("DELETE FROM produtos WHERE id = ?", (product_id,))
    def search(self, term="", category=None, minimum=None, maximum=None):
        clauses, params = ["ativo = 1"], []
        if term: clauses.append("(nome LIKE ? OR descricao LIKE ?)"); params += [f"%{term}%", f"%{term}%"]
        if category: clauses.append("categoria = ?"); params.append(category)
        if minimum is not None: clauses.append("preco >= ?"); params.append(minimum)
        if maximum is not None: clauses.append("preco <= ?"); params.append(maximum)
        with self.database.connect() as db: return [dict(row) for row in db.execute("SELECT * FROM produtos WHERE " + " AND ".join(clauses), params).fetchall()]


class UserRepository:
    def __init__(self, database): self.database = database
    @staticmethod
    def public(row): return {key: row[key] for key in ("id", "nome", "email", "tipo", "criado_em")} if row else None
    def list(self):
        with self.database.connect() as db: return [self.public(row) for row in db.execute("SELECT * FROM usuarios").fetchall()]
    def get(self, user_id):
        with self.database.connect() as db: return self.public(db.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,)).fetchone())
    def create(self, name, email, password):
        with self.database.transaction() as db: return db.execute("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)", (name, email, generate_password_hash(password, method="pbkdf2:sha256:600000"))).lastrowid
    def authenticate(self, email, password):
        with self.database.connect() as db:
            row = db.execute("SELECT * FROM usuarios WHERE email = ?", (email,)).fetchone()
            return self.public(row) if row and check_password_hash(row["senha"], password) else None


class OrderRepository:
    def __init__(self, database): self.database = database
    def create(self, user_id, items):
        with self.database.transaction() as db:
            ids = [int(item["produto_id"]) for item in items]
            products = db.execute(f"SELECT * FROM produtos WHERE id IN ({','.join('?' for _ in ids)})", ids).fetchall()
            by_id = {row["id"]: row for row in products}; total = 0
            for item in items:
                product = by_id.get(int(item["produto_id"])); quantity = int(item["quantidade"])
                if not product: raise ValueError(f"Produto {item['produto_id']} não encontrado")
                if quantity <= 0 or product["estoque"] < quantity: raise ValueError(f"Estoque insuficiente para {product['nome']}")
                total += product["preco"] * quantity
            order_id = db.execute("INSERT INTO pedidos (usuario_id, status, total) VALUES (?, 'pendente', ?)", (user_id, total)).lastrowid
            for item in items:
                product = by_id[int(item["produto_id"])]; quantity = int(item["quantidade"])
                db.execute("INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)", (order_id, product["id"], quantity, product["preco"]))
                db.execute("UPDATE produtos SET estoque = estoque - ? WHERE id = ?", (quantity, product["id"]))
            return {"pedido_id": order_id, "total": total}
    def list(self, user_id=None):
        where, params = ("WHERE p.usuario_id = ?", (user_id,)) if user_id else ("", ())
        with self.database.connect() as db:
            rows = db.execute(f"SELECT p.*, i.produto_id, i.quantidade, i.preco_unitario, pr.nome produto_nome FROM pedidos p LEFT JOIN itens_pedido i ON i.pedido_id=p.id LEFT JOIN produtos pr ON pr.id=i.produto_id {where} ORDER BY p.id", params).fetchall()
        orders = {}
        for row in rows:
            order = orders.setdefault(row["id"], {"id": row["id"], "usuario_id": row["usuario_id"], "status": row["status"], "total": row["total"], "criado_em": row["criado_em"], "itens": []})
            if row["produto_id"] is not None: order["itens"].append({key: row[key] for key in ("produto_id", "produto_nome", "quantidade", "preco_unitario")})
        return list(orders.values())
    def update_status(self, order_id, status):
        with self.database.transaction() as db: db.execute("UPDATE pedidos SET status=? WHERE id=?", (status, order_id))
    def report(self):
        with self.database.connect() as db: row = db.execute("SELECT COUNT(*) total, COALESCE(SUM(total),0) revenue, COALESCE(SUM(status='pendente'),0) pending, COALESCE(SUM(status='aprovado'),0) approved, COALESCE(SUM(status='cancelado'),0) cancelled FROM pedidos").fetchone()
        revenue, total = row["revenue"], row["total"]
        discount = revenue * (0.1 if revenue > 10000 else 0.05 if revenue > 5000 else 0.02 if revenue > 1000 else 0)
        return {"total_pedidos": total, "faturamento_bruto": round(revenue, 2), "desconto_aplicavel": round(discount, 2), "faturamento_liquido": round(revenue-discount, 2), "pedidos_pendentes": row["pending"], "pedidos_aprovados": row["approved"], "pedidos_cancelados": row["cancelled"], "ticket_medio": round(revenue/total, 2) if total else 0}
