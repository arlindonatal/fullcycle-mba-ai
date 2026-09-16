"""
Script para fazer pull de prompts do LangSmith Prompt Hub.

Este script:
1. Conecta ao LangSmith usando credenciais do .env
2. Faz pull dos prompts do Hub
3. Salva localmente em prompts/bug_to_user_story_v1.yml

SIMPLIFICADO: Usa serialização nativa do LangChain para extrair prompts.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from langsmith import Client
from utils import save_yaml, check_env_vars, print_section_header

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SOURCE_PROMPT = "leonanluppi/bug_to_user_story_v1"
OUTPUT_FILE = PROJECT_ROOT / "prompts" / "bug_to_user_story_v1.yml"


def _message_template(message) -> str:
    """Extrai o texto de um message template do LangChain."""
    prompt = getattr(message, "prompt", None)
    template = getattr(prompt, "template", None)
    if isinstance(template, str):
        return template

    raise ValueError(
        f"Tipo de mensagem não suportado no prompt remoto: {type(message).__name__}"
    )


def pull_prompts_from_langsmith():
    """Baixa o prompt público e o serializa no formato YAML do projeto."""
    api_key = os.getenv("LANGSMITH_API_KEY")
    endpoint = os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
    client = Client(api_url=endpoint, api_key=api_key)
    prompt = client.pull_prompt(SOURCE_PROMPT)

    messages = getattr(prompt, "messages", [])
    if len(messages) < 2:
        raise ValueError("O prompt remoto não contém mensagens system e user.")

    prompt_data = {
        "bug_to_user_story_v1": {
            "description": "Prompt para converter relatos de bugs em User Stories",
            "system_prompt": _message_template(messages[0]),
            "user_prompt": _message_template(messages[1]),
            "version": "v1",
            "source": SOURCE_PROMPT,
            "tags": ["bug-analysis", "user-story", "product-management"],
        }
    }

    if not save_yaml(prompt_data, str(OUTPUT_FILE)):
        raise RuntimeError(f"Não foi possível salvar o prompt em {OUTPUT_FILE}")

    return OUTPUT_FILE


def main():
    """Função principal"""
    print_section_header("PULL DO PROMPT INICIAL")

    if not check_env_vars(["LANGSMITH_API_KEY"]):
        return 1

    try:
        output_file = pull_prompts_from_langsmith()
    except Exception as error:
        print(f"❌ Erro ao baixar o prompt: {error}")
        return 1

    print(f"✓ Prompt baixado: {SOURCE_PROMPT}")
    print(f"✓ Arquivo salvo em: {output_file.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
