# Tarefa 2 — Otimização e Avaliação de Prompts

Projeto em Python para baixar um prompt de baixa qualidade do LangSmith Prompt Hub, refatorá-lo com técnicas avançadas de Prompt Engineering, publicá-lo como prompt público versionado e avaliar sua qualidade em 15 relatos de bugs.

## Objetivo

O prompt `bug_to_user_story_v2` converte relatos de bugs simples, médios e complexos em User Stories claras e testáveis. A aprovação exige nota mínima de 0,8 em todas as métricas:

- Helpfulness
- Correctness
- F1-Score
- Clarity
- Precision

## Estrutura

```text
.
├── .env.example
├── requirements.txt
├── prompts/
│   ├── bug_to_user_story_v1.yml
│   └── bug_to_user_story_v2.yml
├── datasets/
│   └── bug_to_user_story.jsonl
├── screenshots/
├── src/
│   ├── pull_prompts.py
│   ├── push_prompts.py
│   ├── evaluate.py
│   ├── metrics.py
│   └── utils.py
└── tests/
    └── test_prompts.py
```

O dataset original, `evaluate.py`, `metrics.py` e `utils.py` foram mantidos sem alterações, conforme solicitado pelo desafio.

## Técnicas Aplicadas (Fase 2)

### 1. Few-shot Learning

O prompt inclui dois pares completos de entrada e saída: um bug simples de compatibilidade de navegador e um problema de exportação com performance e tratamento de falhas. Os exemplos ensinam o formato, o nível de detalhe e a adaptação à complexidade sem depender apenas de regras abstratas.

Exemplo aplicado:

```text
Entrada: Botão de salvar perfil não funciona no Firefox...
Saída: título, User Story no padrão Como/Eu quero/Para que e critérios Dado/Quando/Então.
```

### 2. Role Prompting

A mensagem de sistema define a persona como “Product Manager Sênior e Business Analyst”. Essa combinação orienta o modelo a preservar o valor para o usuário e, ao mesmo tempo, produzir critérios úteis para engenharia e QA.

### 3. Chain of Thought

O modelo recebe uma sequência interna de análise: identificar persona e impacto, separar evidências de causas, levantar cenários e revisar rastreabilidade. O raciocínio deve permanecer interno; somente a User Story final é apresentada.

### 4. Skeleton of Thought

Um esqueleto explícito define a ordem da resposta: título, narrativa da User Story, critérios de aceitação e, quando houver evidências, contexto técnico, impacto, tarefas sugeridas e pontos a esclarecer. Isso melhora consistência e clareza nos 15 níveis de complexidade do dataset.

### Regras e edge cases

O prompt também determina que o modelo:

- não invente dados ausentes;
- preserve números, logs, endpoints, severidade e impacto;
- use “Não informado” quando faltar informação essencial;
- trate soluções não confirmadas apenas como sugestões;
- destaque divergências de valores e necessidade de fonte única;
- agrupe problemas complexos por categoria;
- produza critérios observáveis em Dado/Quando/Então.

## Processo de otimização

| Iteração | Problema identificado | Alteração realizada |
| --- | --- | --- |
| v1 | Persona genérica, instruções vagas e variável duplicada | Separação correta entre system e user prompt; definição de persona |
| v2.1 | Ausência de padrão de saída e critérios verificáveis | Esqueleto Markdown e critérios Dado/Quando/Então |
| v2.2 | Risco de respostas inconsistentes entre bugs simples e complexos | Few-shot com dois níveis de complexidade e estrutura adaptativa |
| v2.3 | Risco de omissão ou alucinação | Checklist interno, preservação de evidências e tratamento de edge cases |
| Avaliação | F1-Score do v1 abaixo do mínimo (0,7798) | Validação do v2 nos mesmos 15 exemplos, atingindo todas as métricas mínimas |

## Resultados Finais

Os sete testes estruturais locais foram aprovados. A avaliação real foi executada em 15 exemplos usando `gpt-4.1-mini` para geração e `gpt-4.1` como LLM avaliadora.

| Prompt | Helpfulness | Correctness | F1-Score | Clarity | Precision | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `leonanluppi/bug_to_user_story_v1` | 0,8617 | 0,8372 | 0,7798 | 0,8287 | 0,8947 | Reprovado |
| `arlindonatal/bug_to_user_story_v2` | 0,9080 | 0,8947 | 0,8527 | 0,8793 | 0,9367 | **Aprovado** |

- Média geral v1: **0,8404**, reprovado porque o F1-Score ficou abaixo de 0,8.
- Média geral v2: **0,8943**, com todas as cinco métricas acima de 0,8.
- Dataset no LangSmith: `prompt-optimization-arlindonatal-eval`, com 15 exemplos.
- Experimento final: `bug-to-user-story-v2-final-2e490087`, com 15 execuções, 75 feedbacks de métricas e nenhum erro.
- [Avaliação final no LangSmith](https://smith.langchain.com/o/7af4f264-d9d4-54d8-ba0f-372f3126193c/datasets/fb6b2af1-aa46-41fb-9195-a0cabff00fc6/compare?selectedSessions=8cac1bc9-ab48-4938-813d-bce978be9971)
- [Prompt público no LangSmith](https://smith.langchain.com/hub/arlindonatal/bug_to_user_story_v2)
- [Dashboard do projeto no LangSmith](https://smith.langchain.com/projects/prompt-optimization-arlindonatal)

### Evidências visuais

- [Prompt v2 público, versionado e com as técnicas aplicadas](screenshots/01-prompt-publico.png)
- [Dataset e comparação dos experimentos com 15 execuções](screenshots/02-dataset-experimentos.png)
- [Tracing das gerações e avaliações](screenshots/03-tracing-geral.png)
- [Experimento final com os 15 exemplos e métricas aprovadas](screenshots/04-experimento-final-metricas.png)
- [Experimento preliminar usado durante a otimização](screenshots/05-experimento-preliminar.png)
- [Trace detalhado de um bug simples: botão do carrinho](screenshots/06-trace-simples-carrinho.png)
- [Trace detalhado de um bug médio: webhook de pagamento](screenshots/07-trace-medio-webhook.png)
- [Execuções dos avaliadores de qualidade](screenshots/08-execucoes-avaliadores.png)
- [Trace detalhado de um bug complexo: input do checkout](screenshots/09-trace-complexo-checkout-input.png)
- [Trace detalhado de um bug complexo: output do checkout](screenshots/10-trace-complexo-checkout-output.png)

O experimento final é a fonte dos valores apresentados na tabela. A execução preliminar foi preservada apenas como evidência do processo iterativo de avaliação e otimização. Os traces detalhados contemplam exemplos simples, médios e complexos, conforme exigido pelo desafio.

Os resultados foram obtidos pela execução autenticada no LangSmith em 16 de setembro de 2026.

## Como Executar

### Pré-requisitos

- Python 3.9 ou superior
- Conta e API key do LangSmith
- API key da OpenAI com créditos

O projeto usa `gpt-4.1-mini` para gerar as User Stories e `gpt-4.1` como avaliador. Ambos são parametrizados no `.env` e podem ser substituídos. Consulte a documentação oficial: [GPT-4.1 Mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini) e [GPT-4.1](https://developers.openai.com/api/docs/models/gpt-4.1).

### 1. Ambiente virtual

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha no `.env`:

```dotenv
LANGSMITH_API_KEY=sua-chave-langsmith
LANGSMITH_PROJECT=prompt-optimization-arlindonatal
USERNAME_LANGSMITH_HUB=seu-username-publico
OPENAI_API_KEY=sua-chave-openai
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1-mini
EVAL_MODEL=gpt-4.1
```

O `.env` está ignorado pelo Git. Nunca publique credenciais no repositório.

### 3. Pull do prompt v1

```bash
python src/pull_prompts.py
```

O script baixa `leonanluppi/bug_to_user_story_v1` e o salva em `prompts/bug_to_user_story_v1.yml`.

### 4. Testes locais

```bash
pytest tests/test_prompts.py
```

Os testes verificam system prompt, persona, formato, exemplos Few-shot, ausência de marcadores pendentes e quantidade mínima de técnicas.

### 5. Push público do prompt v2

```bash
python src/push_prompts.py
```

O script valida o YAML e publica `{USERNAME_LANGSMITH_HUB}/bug_to_user_story_v2` como público, incluindo descrição, tags e técnicas aplicadas.

### 6. Avaliação

```bash
python src/evaluate.py
```

O processo cria ou reutiliza o dataset com 15 exemplos, executa o prompt publicado, calcula as cinco métricas e apresenta o resultado. Todas as notas e a média devem ser maiores ou iguais a 0,8.

## Segurança

- `.env`, logs e resultados locais não são versionados.
- O repositório contém somente `.env.example`, sem valores secretos.
- Chaves temporárias devem ser revogadas ao final da avaliação.
