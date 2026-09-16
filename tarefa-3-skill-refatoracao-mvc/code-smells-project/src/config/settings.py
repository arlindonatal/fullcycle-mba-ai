import os
import secrets
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Settings:
    database_path: str
    secret_key: str
    debug: bool
    port: int
    admin_token: Optional[str]

    @classmethod
    def from_env(cls):
        return cls(
            os.getenv("DATABASE_PATH", "loja.db"),
            os.getenv("SECRET_KEY", secrets.token_hex(32)),
            os.getenv("FLASK_DEBUG", "false").lower() == "true",
            int(os.getenv("PORT", "5000")),
            os.getenv("ADMIN_TOKEN"),
        )
