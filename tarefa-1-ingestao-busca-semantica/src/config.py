"""Configurações compartilhadas pela ingestão e pela busca."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


PROJECT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_DIR / ".env")


def required_env(name: str) -> str:
    """Retorna uma variável obrigatória ou explica como configurá-la."""
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(
            f"A variável {name} não foi configurada. "
            "Copie .env.example para .env e preencha os valores necessários."
        )
    return value


def pdf_path() -> Path:
    """Resolve PDF_PATH em relação à raiz do projeto quando necessário."""
    configured_path = os.getenv("PDF_PATH", "document.pdf").strip()
    path = Path(configured_path).expanduser()
    if not path.is_absolute():
        path = PROJECT_DIR / path
    return path.resolve()


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/rag",
).strip()
COLLECTION_NAME = os.getenv(
    "PG_VECTOR_COLLECTION_NAME", "mba_ia_document"
).strip()
EMBEDDING_MODEL = os.getenv(
    "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"
).strip()
CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4.1-mini").strip()
