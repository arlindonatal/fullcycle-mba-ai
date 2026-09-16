import sqlite3
from contextlib import contextmanager


class Database:
    def __init__(self, path): self.path = path

    def connect(self):
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    @contextmanager
    def transaction(self):
        connection = self.connect()
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize(self):
        with self.transaction() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS produtos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, descricao TEXT NOT NULL DEFAULT '', preco REAL NOT NULL CHECK(preco >= 0), estoque INTEGER NOT NULL CHECK(estoque >= 0), categoria TEXT NOT NULL, ativo INTEGER NOT NULL DEFAULT 1, criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
                CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE, senha TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'cliente', criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
                CREATE TABLE IF NOT EXISTS pedidos (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL REFERENCES usuarios(id), status TEXT NOT NULL DEFAULT 'pendente', total REAL NOT NULL, criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
                CREATE TABLE IF NOT EXISTS itens_pedido (id INTEGER PRIMARY KEY AUTOINCREMENT, pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE, produto_id INTEGER NOT NULL REFERENCES produtos(id), quantidade INTEGER NOT NULL CHECK(quantidade > 0), preco_unitario REAL NOT NULL);
            """)
            if db.execute("SELECT COUNT(*) FROM produtos").fetchone()[0] == 0:
                db.executemany("INSERT INTO produtos (nome, descricao, preco, estoque, categoria) VALUES (?, ?, ?, ?, ?)", [("Notebook Gamer", "Notebook potente", 5999.99, 10, "informatica"), ("Mouse Wireless", "Mouse sem fio", 89.90, 50, "informatica")])
