from app import create_app


def test_boot_and_original_endpoints():
    app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    client = app.test_client()
    assert client.get('/health').status_code == 200
    assert client.get('/tasks').status_code == 200
    assert client.get('/users').status_code == 200
    assert client.get('/reports/summary').status_code == 200
    created = client.post('/users', json={'name': 'Ana', 'email': 'ana@example.com', 'password': 'safe-password'})
    assert created.status_code == 201
    assert 'password' not in created.get_json()
