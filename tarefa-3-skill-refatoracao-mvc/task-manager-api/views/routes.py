from controllers.task_controller import task_bp
from controllers.user_controller import user_bp
from controllers.report_controller import report_bp


def register_routes(app):
    app.register_blueprint(task_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(report_bp)
