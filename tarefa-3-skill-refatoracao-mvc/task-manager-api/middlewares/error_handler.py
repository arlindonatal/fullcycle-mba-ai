from flask import jsonify


def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(_error): return jsonify({'error': 'Recurso não encontrado'}), 404

    @app.errorhandler(Exception)
    def unexpected(error):
        app.logger.exception('Unhandled application error', exc_info=error)
        return jsonify({'error': 'Erro interno'}), 500
