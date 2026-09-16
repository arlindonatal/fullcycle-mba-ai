"""Busca semântica e geração de respostas limitadas ao conteúdo do PDF."""

from __future__ import annotations

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_postgres import PGVector

from config import (
    CHAT_MODEL,
    COLLECTION_NAME,
    DATABASE_URL,
    EMBEDDING_MODEL,
    required_env,
)


TOP_K = 10
FALLBACK_ANSWER = "Não tenho informações necessárias para responder sua pergunta."

PROMPT_TEMPLATE = """CONTEXTO:
{contexto}

REGRAS:
- Responda somente com base no CONTEXTO.
- Se a informação não estiver explicitamente no CONTEXTO, responda:
  "Não tenho informações necessárias para responder sua pergunta."
- Nunca invente ou use conhecimento externo.
- Nunca produza opiniões ou interpretações além do que está escrito.

EXEMPLOS DE PERGUNTAS FORA DO CONTEXTO:
Pergunta: "Qual é a capital da França?"
Resposta: "Não tenho informações necessárias para responder sua pergunta."

Pergunta: "Quantos clientes temos em 2024?"
Resposta: "Não tenho informações necessárias para responder sua pergunta."

Pergunta: "Você acha isso bom ou ruim?"
Resposta: "Não tenho informações necessárias para responder sua pergunta."

PERGUNTA DO USUÁRIO:
{pergunta}

RESPONDA A "PERGUNTA DO USUÁRIO"
"""


def get_vector_store() -> PGVector:
    """Cria uma conexão com a collection já populada pela ingestão."""
    required_env("OPENAI_API_KEY")
    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
    return PGVector(
        embeddings=embeddings,
        collection_name=COLLECTION_NAME,
        connection=DATABASE_URL,
        use_jsonb=True,
    )


def format_context(results: list[tuple[object, float]]) -> str:
    """Concatena os documentos recuperados, preservando página e score."""
    sections: list[str] = []
    for document, score in results:
        page = document.metadata.get("page")
        page_label = page + 1 if isinstance(page, int) else "desconhecida"
        sections.append(
            f"[Página {page_label} | distância {score:.4f}]\n{document.page_content}"
        )
    return "\n\n---\n\n".join(sections)


def search_documents(question: str) -> list[tuple[object, float]]:
    """Busca os dez chunks semanticamente mais próximos da pergunta."""
    return get_vector_store().similarity_search_with_score(question, k=TOP_K)


def search_prompt(question: str) -> str:
    """Recupera contexto relevante e solicita à LLM uma resposta fundamentada."""
    normalized_question = question.strip()
    if not normalized_question:
        raise ValueError("A pergunta não pode estar vazia.")

    results = search_documents(normalized_question)
    if not results:
        return FALLBACK_ANSWER

    prompt = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    llm = ChatOpenAI(model=CHAT_MODEL, temperature=0)
    chain = prompt | llm | StrOutputParser()
    return chain.invoke(
        {
            "contexto": format_context(results),
            "pergunta": normalized_question,
        }
    ).strip()
