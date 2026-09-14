from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint_reports_p0_mock_mode():
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "service": "FlowPilot AI",
        "status": "ok",
        "phase": "P0",
        "mock_ai": True,
    }


def test_project_plan_endpoint_exposes_resume_aligned_modules():
    response = client.get("/api/project-plan")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "FlowPilot AI"
    assert data["positioning"] == "企业 AI 智能运营工作台"
    assert data["current_focus"] == "企业产品内容与 GEO 工作台"
    assert "GEO Research" in data["p0_modules"]
    assert "AI Citation Readiness" in data["p0_modules"]
    assert "GEO Monitor" in data["reserved_modules"]
