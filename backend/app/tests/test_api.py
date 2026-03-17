import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_metrics_returns_expected_fields():
    r = client.get("/api/metrics")
    assert r.status_code == 200
    data = r.json()
    assert "total_docs" in data
    assert "total_chunks" in data
    assert "avg_retrieval_latency_ms" in data
    assert "avg_generation_latency_ms" in data
    assert "llm_model" in data
    assert "embedding_model" in data

def test_ingest_returns_ok():
    r = client.post("/api/ingest")
    assert r.status_code == 200
    data = r.json()
    assert "indexed_docs" in data
    assert "indexed_chunks" in data
    assert isinstance(data["indexed_chunks"], int)

def test_ingest_loads_all_docs():
    client.post("/api/ingest")
    r = client.get("/api/metrics")
    data = r.json()
    assert data["total_docs"] >= 6
    assert data["total_chunks"] > 0

def test_ask_returns_expected_fields():
    client.post("/api/ingest")
    r = client.post("/api/ask", json={"query": "What is the refund policy?"})
    assert r.status_code == 200
    data = r.json()
    assert "answer" in data
    assert "citations" in data
    assert "chunks" in data
    assert isinstance(data["answer"], str)
    assert isinstance(data["citations"], list)
    assert isinstance(data["chunks"], list)

def test_ask_returns_citations():
    client.post("/api/ingest")
    r = client.post("/api/ask", json={"query": "What is the refund policy?"})
    data = r.json()
    assert len(data["citations"]) > 0
    citation = data["citations"][0]
    assert "title" in citation
    assert "section" in citation

def test_ask_citations_contain_relevant_doc():
    client.post("/api/ingest")
    r = client.post("/api/ask", json={
        "query": "Can a customer return a damaged blender after 20 days?"
    })
    data = r.json()
    titles = [c["title"] for c in data["citations"]]
    assert any("Returns" in t or "Warranty" in t for t in titles)

def test_ask_shipping_query():
    client.post("/api/ingest")
    r = client.post("/api/ask", json={
        "query": "What is the shipping SLA to East Malaysia for bulky items?"
    })
    data = r.json()
    titles = [c["title"] for c in data["citations"]]
    assert any("Delivery" in t or "Shipping" in t for t in titles)

def test_ask_with_custom_k():
    client.post("/api/ingest")
    r = client.post("/api/ask", json={"query": "warranty policy", "k": 2})
    assert r.status_code == 200
    data = r.json()
    assert len(data["chunks"]) <= 2

def test_ask_empty_query_still_responds():
    client.post("/api/ingest")
    r = client.post("/api/ask", json={"query": "hello"})
    assert r.status_code == 200
