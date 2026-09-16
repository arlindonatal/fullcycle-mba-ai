import os
import tempfile
from src.app import create_app


def test_boot_and_core_contracts():
    handle, path = tempfile.mkstemp(suffix=".db"); os.close(handle)
    try:
        client = create_app({"TESTING": True, "DATABASE_PATH": path}).test_client()
        assert client.get("/health").status_code == 200
        assert client.get("/produtos").status_code == 200
        assert client.post("/produtos", json={"nome": "Livro", "preco": 10, "estoque": 2, "categoria": "livros"}).status_code == 201
        assert client.post("/admin/query", json={"sql": "DROP TABLE usuarios"}).status_code == 403
    finally:
        os.unlink(path)
