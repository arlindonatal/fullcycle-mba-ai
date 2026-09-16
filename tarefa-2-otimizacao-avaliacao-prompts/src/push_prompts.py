"""
Script para fazer push de prompts otimizados ao LangSmith Prompt Hub.

Este script:
1. Lê os prompts otimizados de prompts/bug_to_user_story_v2.yml
2. Valida os prompts
3. Faz push PÚBLICO para o LangSmith Hub
4. Adiciona metadados (tags, descrição, técnicas utilizadas)

SIMPLIFICADO: Código mais limpo e direto ao ponto.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langsmith import Client
from utils import (
    load_yaml,
    check_env_vars,
    print_section_header,
    validate_prompt_structure,
)

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PROMPTS_FILE = PROJECT_ROOT / "prompts" / "bug_to_user_story_v2.yml"


def push_prompt_to_langsmith(prompt_name: str, prompt_data: dict) -> bool:
    """
    Faz push do prompt otimizado para o LangSmith Hub (PÚBLICO).

    Args:
        prompt_name: Nome do prompt
        prompt_data: Dados do prompt

    Returns:
        True se sucesso, False caso contrário
    """
    username = os.getenv("USERNAME_LANGSMITH_HUB", "").strip()
    if not username:
        print("❌ USERNAME_LANGSMITH_HUB não configurada.")
        return False

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", prompt_data["system_prompt"]),
            ("human", prompt_data["user_prompt"]),
        ]
    )
    full_name = f"{username}/{prompt_name}"

    try:
        client = Client(
            api_url=os.getenv(
                "LANGSMITH_ENDPOINT", "https://api.smith.langchain.com"
            ),
            api_key=os.getenv("LANGSMITH_API_KEY"),
        )
        techniques = prompt_data.get("techniques_applied", [])
        url = client.push_prompt(
            full_name,
            object=prompt,
            is_public=True,
            description=prompt_data["description"],
            readme="Técnicas aplicadas: " + ", ".join(techniques),
            tags=prompt_data.get("tags", []) + prompt_data.get(
                "techniques_applied", []
            ),
        )
    except Exception as error:
        if "nothing to commit" in str(error).lower():
            client.update_prompt(
                full_name,
                is_public=True,
                description=prompt_data["description"],
                readme="Técnicas aplicadas: " + ", ".join(techniques),
                tags=prompt_data.get("tags", []) + techniques,
            )
            url = client.push_prompt(full_name)
            print(f"✓ Prompt já estava atualizado: {full_name}")
            print(f"✓ URL: {url}")
            return True

        print(f"❌ Erro ao publicar {full_name}: {error}")
        return False

    print(f"✓ Prompt publicado: {full_name}")
    print(f"✓ URL: {url}")
    return True


def validate_prompt(prompt_data: dict) -> tuple[bool, list]:
    """
    Valida estrutura básica de um prompt (versão simplificada).

    Args:
        prompt_data: Dados do prompt

    Returns:
        (is_valid, errors) - Tupla com status e lista de erros
    """
    is_valid, errors = validate_prompt_structure(prompt_data)

    user_prompt = prompt_data.get("user_prompt", "").strip()
    system_prompt = prompt_data.get("system_prompt", "")
    if not user_prompt:
        errors.append("user_prompt está vazio")
    elif "{bug_report}" not in user_prompt:
        errors.append("user_prompt deve conter a variável {bug_report}")

    normalized = system_prompt.lower()
    if "product manager" not in normalized:
        errors.append("system_prompt deve definir a persona Product Manager")
    if "exemplo" not in normalized or "entrada" not in normalized or "saída" not in normalized:
        errors.append("system_prompt deve conter exemplos Few-shot de entrada e saída")
    if "markdown" not in normalized and "user story" not in normalized:
        errors.append("system_prompt deve definir o formato da resposta")

    return (is_valid and not errors, errors)


def main():
    """Função principal"""
    print_section_header("PUSH DOS PROMPTS OTIMIZADOS")

    if not check_env_vars(["LANGSMITH_API_KEY", "USERNAME_LANGSMITH_HUB"]):
        return 1

    prompts = load_yaml(str(PROMPTS_FILE))
    if not prompts:
        return 1

    success = True
    for prompt_name, prompt_data in prompts.items():
        is_valid, errors = validate_prompt(prompt_data)
        if not is_valid:
            print(f"❌ Prompt inválido: {prompt_name}")
            for error in errors:
                print(f"   - {error}")
            success = False
            continue

        success = push_prompt_to_langsmith(prompt_name, prompt_data) and success

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
