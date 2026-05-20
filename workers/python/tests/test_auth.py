from fastapi.testclient import TestClient

from app.main import app


def test_health_does_not_require_auth(monkeypatch):
    monkeypatch.delenv("AI_SERVICE_TOKEN", raising=False)
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200


def test_profile_requires_auth(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_TOKEN", "secret-token")
    client = TestClient(app)

    response = client.post("/profile", json={"lead": {"business_name": "Test"}})

    assert response.status_code == 401


def test_profile_rejects_wrong_token(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_TOKEN", "secret-token")
    client = TestClient(app)

    response = client.post("/profile", headers={"Authorization": "Bearer wrong"}, json={"lead": {"business_name": "Test"}})

    assert response.status_code == 401
