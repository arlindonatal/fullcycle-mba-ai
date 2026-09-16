from flask import Flask
from flask_cors import CORS
from database import db
from config.settings import Settings
from views.routes import register_routes
from middlewares.error_handler import register_error_handlers
import datetime

def create_app(overrides=None):
    settings = Settings.from_env()
    app = Flask(__name__)
    app.config.update(
        SQLALCHEMY_DATABASE_URI=settings.database_uri,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SECRET_KEY=settings.secret_key,
        DEBUG=settings.debug,
    )
    if overrides:
        app.config.update(overrides)
    CORS(app)
    db.init_app(app)
    register_routes(app)
    register_error_handlers(app)

    @app.route('/health')
    def health(): return {'status': 'ok', 'timestamp': str(datetime.datetime.now(datetime.timezone.utc))}

    @app.route('/')
    def index(): return {'message': 'Task Manager API', 'version': '2.0'}

    with app.app_context(): db.create_all()
    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=app.config['DEBUG'], host='0.0.0.0', port=5000)
