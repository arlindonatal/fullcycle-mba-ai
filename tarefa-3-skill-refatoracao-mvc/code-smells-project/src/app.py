from flask import Flask
from flask_cors import CORS
from .config import Settings
from .controllers import AdminController, OrderController, ProductController, UserController
from .database import Database
from .middlewares import register_error_handlers
from .models import OrderRepository, ProductRepository, UserRepository
from .views import create_blueprint


def create_app(overrides=None):
    settings = Settings.from_env()
    app = Flask(__name__)
    app.config.update(SECRET_KEY=settings.secret_key, DEBUG=settings.debug, PORT=settings.port)
    if overrides: app.config.update(overrides)
    database = Database(app.config.get("DATABASE_PATH", settings.database_path)); database.initialize()
    blueprint = create_blueprint(
        ProductController(ProductRepository(database)), UserController(UserRepository(database)),
        OrderController(OrderRepository(database)), AdminController(database, app.config.get("ADMIN_TOKEN", settings.admin_token)), database,
    )
    app.register_blueprint(blueprint); register_error_handlers(app); CORS(app)
    return app
