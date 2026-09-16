# Tarefa 1 — Ingestão e Busca Semântica

Aplicação RAG em Python que lê um PDF, divide o conteúdo em chunks, gera embeddings com OpenAI, armazena os vetores no PostgreSQL/pgVector e responde perguntas pelo terminal usando apenas o conteúdo recuperado do documento.

## Tecnologias

- Python 3.9+
- LangChain
- OpenAI (`text-embedding-3-small` e `gpt-4.1-mini`)
- PostgreSQL 17 com pgVector
- Docker e Docker Compose

Os modelos ficam parametrizados no `.env`, portanto podem ser atualizados sem alterar o código. Os padrões foram escolhidos consultando a documentação oficial da OpenAI: [`text-embedding-3-small`](https://developers.openai.com/api/docs/models/text-embedding-3-small) e [`gpt-4.1-mini`](https://developers.openai.com/api/docs/models/gpt-4.1-mini).

## Estrutura

```text
.
├── docker-compose.yml
├── requirements.txt
├── .env.example
├── src/
│   ├── config.py
│   ├── ingest.py
│   ├── search.py
│   └── chat.py
├── document.pdf
└── README.md
```

## Pré-requisitos

- Python 3.9 ou superior
- Docker com Docker Compose
- Uma chave válida da API da OpenAI

## Configuração

Entre na pasta da tarefa:

```bash
cd tarefa-1-ingestao-busca-semantica
```

Crie e ative o ambiente virtual:

```bash
python3 -m venv venv
source venv/bin/activate
```

No Windows PowerShell, a ativação é feita com:

```powershell
.\venv\Scripts\Activate.ps1
```

Instale as dependências:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Crie o arquivo local de configuração:

```bash
cp .env.example .env
```

Edite o `.env` e preencha sua chave:

```dotenv
OPENAI_API_KEY=sua-chave-openai-aqui
```

> O `.env` está listado no `.gitignore` e não será versionado. Nunca coloque a chave diretamente no código ou no `.env.example`.

## Execução

1. Inicie o PostgreSQL com pgVector:

```bash
docker compose up -d
```

Confirme que os dois serviços finalizaram corretamente:

```bash
docker compose ps
```

2. Faça a ingestão do PDF:

```bash
python src/ingest.py
```

O script carrega `document.pdf`, cria chunks de **1000 caracteres com overlap de 150**, gera os embeddings e recria a collection configurada no pgVector. Isso torna novas execuções idempotentes, sem duplicar os chunks.

3. Inicie o chat:

```bash
python src/chat.py
```

Exemplo:

```text
PERGUNTA: Qual o faturamento da Empresa SuperTechIABrazil?
RESPOSTA: O faturamento foi de 10 milhões de reais.
```

Para encerrar, digite `sair`.

## Como funciona

1. `ingest.py` extrai o texto do PDF com `PyPDFLoader`.
2. `RecursiveCharacterTextSplitter` divide o texto em chunks de 1000 caracteres e overlap de 150.
3. `OpenAIEmbeddings` transforma cada chunk em vetor.
4. `PGVector` persiste os textos, metadados e vetores no PostgreSQL.
5. A cada pergunta, `search.py` gera o embedding da consulta e executa `similarity_search_with_score(..., k=10)`.
6. Os dez resultados são concatenados no prompt obrigatório, e `ChatOpenAI` produz a resposta baseada somente nesse contexto.

## Variáveis de ambiente

| Variável | Obrigatória | Valor padrão/finalidade |
| --- | --- | --- |
| `OPENAI_API_KEY` | Sim | Credencial da API; deve existir apenas no `.env` local |
| `OPENAI_EMBEDDING_MODEL` | Não | `text-embedding-3-small` |
| `OPENAI_CHAT_MODEL` | Não | `gpt-4.1-mini` |
| `DATABASE_URL` | Não | Conexão local criada pelo Compose |
| `PG_VECTOR_COLLECTION_NAME` | Não | `mba_ia_document` |
| `PDF_PATH` | Não | `document.pdf` |

## Troca do modelo de embeddings

Modelos de embedding podem gerar vetores com dimensões diferentes. Ao trocar `OPENAI_EMBEDDING_MODEL`, execute novamente `python src/ingest.py`; este projeto recria apenas a collection configurada. Para apagar todo o banco e começar do zero:

```bash
docker compose down -v
docker compose up -d
python src/ingest.py
```

O comando com `-v` remove o volume local do banco e todos os dados armazenados nele.

## Solução de problemas

- **Conexão recusada:** aguarde o PostgreSQL ficar saudável em `docker compose ps`.
- **PDF não encontrado:** confira `PDF_PATH` no `.env`.
- **Erro de autenticação:** confira `OPENAI_API_KEY` e os créditos/permissões da conta.
- **Dimensão de vetor incompatível:** refaça a ingestão depois de trocar o modelo; se necessário, recrie o volume conforme a seção anterior.
- **Porta 5432 ocupada:** pare o PostgreSQL local ou altere a porta publicada e ajuste `DATABASE_URL`.
