import pytest
from fastapi.testclient import TestClient
import io
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_list_licenses():
    r = client.get("/api/licenses")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 10
    ids = [l["id"] for l in data]
    assert "MIT" in ids
    assert "AGPL-3.0" in ids


def test_list_policies():
    r = client.get("/api/policies")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 3
    ids = [p["id"] for p in data]
    assert "enterprise-safe" in ids


def test_demo_analysis():
    r = client.post("/api/analyze/demo")
    assert r.status_code == 200
    data = r.json()
    assert "id" in data
    assert data["totalDependencies"] > 0
    assert data["overallRisk"] in ("low", "medium", "high", "critical")


def test_demo_then_get():
    r = client.post("/api/analyze/demo")
    assert r.status_code == 200
    analysis_id = r.json()["id"]

    r2 = client.get(f"/api/analyze/{analysis_id}")
    assert r2.status_code == 200
    assert r2.json()["id"] == analysis_id


def test_history():
    client.post("/api/analyze/demo")
    r = client.get("/api/history")
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_upload_requirements_txt():
    content = b"requests==2.31.0\nflask>=3.0.0\nnumpy\n"
    r = client.post(
        "/api/analyze",
        files={"file": ("requirements.txt", io.BytesIO(content), "text/plain")},
        data={"project_name": "test-pip", "policy_id": "enterprise-safe"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["ecosystem"] == "pip"
    assert data["totalDependencies"] == 3


def test_upload_package_json():
    content = b'{"dependencies": {"express": "^4.18.2"}, "devDependencies": {"jest": "^29.0.0"}}'
    r = client.post(
        "/api/analyze",
        files={"file": ("package.json", io.BytesIO(content), "application/json")},
        data={"project_name": "test-npm"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["ecosystem"] == "npm"
    assert data["totalDependencies"] >= 1


def test_unsupported_file():
    r = client.post(
        "/api/analyze",
        files={"file": ("Dockerfile", io.BytesIO(b"FROM python"), "text/plain")},
        data={"project_name": "bad"},
    )
    assert r.status_code == 400


def test_export_csv():
    r = client.post("/api/analyze/demo")
    analysis_id = r.json()["id"]

    r2 = client.get(f"/api/analyze/{analysis_id}/export/csv")
    assert r2.status_code == 200
    assert r2.headers["content-type"].startswith("text/csv")
    text = r2.text
    assert "LicenseLens" in text
    assert "Dependencies" in text