import os
import secrets
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_uri: str
    secret_key: str
    debug: bool

    @classmethod
    def from_env(cls):
        return cls(
            os.getenv('DATABASE_URI', 'sqlite:///tasks.db'),
            os.getenv('SECRET_KEY', secrets.token_hex(32)),
            os.getenv('FLASK_DEBUG', 'false').lower() == 'true',
        )
