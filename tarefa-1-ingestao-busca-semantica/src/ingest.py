"""Carrega o PDF, divide o texto e persiste seus embeddings no pgVector."""

from __future__ import annotations

from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import (
    COLLECTION_NAME,
    DATABASE_URL,
    EMBEDDING_MODEL,
    pdf_path,
    required_env,
)


CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150


def ingest_pdf() -> int:
    """Ingere o PDF configurado e retorna a quantidade de chunks gravados."""
    required_env("OPENAI_API_KEY")
    source = pdf_path()
    if not source.is_file():
        raise FileNotFoundError(
            f"PDF não encontrado em: {source}. Verifique a variável PDF_PATH."
        )

    pages = PyPDFLoader(str(source)).load()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        is_separator_regex=False,
    )
    chunks = splitter.split_documents(pages)

    if not chunks:
        raise RuntimeError("O PDF não possui texto que possa ser ingerido.")

    for index, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = index
        chunk.metadata["source"] = source.name

    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
    PGVector.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        connection=DATABASE_URL,
        use_jsonb=True,
        pre_delete_collection=True,
    )
    return len(chunks)


def main() -> None:
    try:
        chunk_count = ingest_pdf()
    except Exception as error:
        raise SystemExit(f"Erro durante a ingestão: {error}") from error

    print(f"Ingestão concluída: {chunk_count} chunks armazenados no pgVector.")


if __name__ == "__main__":
    main()
