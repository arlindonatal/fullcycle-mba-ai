from flask import jsonify
from sqlite3 import IntegrityError


def register_error_handlers(app):
    @app.errorhandler(IntegrityError)
    def integrity_error(_error): return jsonify({"erro": "Conflito de dados", "sucesso": False}), 409

    @app.errorhandler(Exception)
    def unexpected_error(error):
        app.logger.exception("Unhandled application error", exc_info=error)
        return jsonify({"erro": "Erro interno", "sucesso": False}), 500
