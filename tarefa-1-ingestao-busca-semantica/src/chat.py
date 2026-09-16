"""Interface de chat via linha de comando."""

from __future__ import annotations

from search import search_prompt


EXIT_COMMANDS = {"sair", "exit", "quit"}


def main() -> None:
    print("Chat com o documento. Digite 'sair' para encerrar.\n")

    while True:
        try:
            question = input("PERGUNTA: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nChat encerrado.")
            return

        if question.lower() in EXIT_COMMANDS:
            print("Chat encerrado.")
            return
        if not question:
            print("RESPOSTA: Digite uma pergunta.\n")
            continue

        try:
            answer = search_prompt(question)
        except Exception as error:
            print(f"ERRO: não foi possível responder: {error}\n")
            continue

        print(f"RESPOSTA: {answer}\n")


if __name__ == "__main__":
    main()
