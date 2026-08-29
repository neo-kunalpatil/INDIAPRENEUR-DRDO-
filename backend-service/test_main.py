import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_telemetry_latest_endpoint():
    response = client.get("/api/telemetry/latest")
    assert response.status_code in [200, 503]

def test_engine_endpoint():
    response = client.get("/api/engine")
    assert response.status_code in [200, 503]

def test_alerts_endpoint():
    response = client.get("/api/alerts")
    assert response.status_code in [200, 503]
