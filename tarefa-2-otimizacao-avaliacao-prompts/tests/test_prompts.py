"""
Testes automatizados para validação de prompts.
"""
import pytest
import yaml
import sys
from pathlib import Path

# Adicionar src ao path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from utils import validate_prompt_structure

def load_prompts(file_path: str):
    """Carrega prompts do arquivo YAML."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

class TestPrompts:
    @pytest.fixture(autouse=True)
    def setup_prompt(self):
        prompt_file = Path(__file__).parent.parent / "prompts" / "bug_to_user_story_v2.yml"
        prompts = load_prompts(str(prompt_file))
        self.prompt = prompts["bug_to_user_story_v2"]
        self.system_prompt = self.prompt.get("system_prompt", "")

    def test_prompt_has_system_prompt(self):
        """Verifica se o campo 'system_prompt' existe e não está vazio."""
        assert "system_prompt" in self.prompt
        assert self.system_prompt.strip()

    def test_prompt_has_role_definition(self):
        """Verifica se o prompt define uma persona (ex: "Você é um Product Manager")."""
        normalized = self.system_prompt.lower()
        assert "você é" in normalized
        assert "product manager" in normalized

    def test_prompt_mentions_format(self):
        """Verifica se o prompt exige formato Markdown ou User Story padrão."""
        normalized = self.system_prompt.lower()
        assert "markdown" in normalized
        assert "como [persona], eu quero [objetivo], para que [benefício]" in normalized

    def test_prompt_has_few_shot_examples(self):
        """Verifica se o prompt contém exemplos de entrada/saída (técnica Few-shot)."""
        normalized = self.system_prompt.lower()
        assert "few-shot" in normalized
        assert normalized.count("entrada:") >= 2
        assert normalized.count("saída:") >= 2

    def test_prompt_no_todos(self):
        """Garante que você não esqueceu nenhum `[TODO]` no texto."""
        serialized_prompt = yaml.safe_dump(self.prompt, allow_unicode=True)
        assert "[TODO]" not in serialized_prompt

    def test_minimum_techniques(self):
        """Verifica (através dos metadados do yaml) se pelo menos 2 técnicas foram listadas."""
        techniques = self.prompt.get("techniques_applied", [])
        assert len(techniques) >= 2
        assert "Few-shot Learning" in techniques

    def test_prompt_structure_is_valid(self):
        """Executa também a validação compartilhada usada antes do push."""
        is_valid, errors = validate_prompt_structure(self.prompt)
        assert is_valid, errors

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
