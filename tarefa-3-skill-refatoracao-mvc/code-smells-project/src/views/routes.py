from flask import Blueprint, jsonify, request


def create_blueprint(products, users, orders, admin, database):
    api = Blueprint("api", __name__)
    respond = lambda result: (jsonify(result[0]), result[1])
    api.add_url_rule("/produtos", "list_products", lambda: respond(products.list()), methods=["GET"])
    api.add_url_rule("/produtos/busca", "search_products", lambda: respond(products.search(request.args)), methods=["GET"])
    api.add_url_rule("/produtos/<int:item_id>", "get_product", lambda item_id: respond(products.get(item_id)), methods=["GET"])
    api.add_url_rule("/produtos", "create_product", lambda: respond(products.save(request.get_json(silent=True))), methods=["POST"])
    api.add_url_rule("/produtos/<int:item_id>", "update_product", lambda item_id: respond(products.save(request.get_json(silent=True), item_id)), methods=["PUT"])
    api.add_url_rule("/produtos/<int:item_id>", "delete_product", lambda item_id: respond(products.delete(item_id)), methods=["DELETE"])
    api.add_url_rule("/usuarios", "list_users", lambda: respond(users.list()), methods=["GET"])
    api.add_url_rule("/usuarios/<int:item_id>", "get_user", lambda item_id: respond(users.get(item_id)), methods=["GET"])
    api.add_url_rule("/usuarios", "create_user", lambda: respond(users.create(request.get_json(silent=True))), methods=["POST"])
    api.add_url_rule("/login", "login", lambda: respond(users.login(request.get_json(silent=True))), methods=["POST"])
    api.add_url_rule("/pedidos", "create_order", lambda: respond(orders.create(request.get_json(silent=True))), methods=["POST"])
    api.add_url_rule("/pedidos", "list_orders", lambda: respond(orders.list()), methods=["GET"])
    api.add_url_rule("/pedidos/usuario/<int:item_id>", "list_user_orders", lambda item_id: respond(orders.list(item_id)), methods=["GET"])
    api.add_url_rule("/pedidos/<int:item_id>/status", "update_order", lambda item_id: respond(orders.update_status(item_id, request.get_json(silent=True))), methods=["PUT"])
    api.add_url_rule("/relatorios/vendas", "sales_report", lambda: respond(orders.report()), methods=["GET"])
    api.add_url_rule("/admin/reset-db", "reset", lambda: respond(admin.reset(request.headers.get("X-Admin-Token"))), methods=["POST"])
    api.add_url_rule("/admin/query", "query", lambda: respond(admin.query(request.headers.get("X-Admin-Token"), request.get_json(silent=True))), methods=["POST"])

    @api.get("/health")
    def health():
        with database.connect() as db: db.execute("SELECT 1")
        return jsonify({"status": "ok", "database": "connected", "versao": "2.0.0"}), 200

    @api.get("/")
    def index(): return jsonify({"mensagem": "Bem-vindo à API da Loja", "versao": "2.0.0"})
    return api
