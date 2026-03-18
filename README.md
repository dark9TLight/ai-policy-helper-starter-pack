# AI Policy & Product Helper

A local-first RAG (Retrieval-Augmented Generation) chatbot that answers questions about company policies and products with citations.

## Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js 14    │────▶│   FastAPI        │────▶│   Qdrant        │
│   Frontend      │     │   Backend        │     │   Vector DB     │
│   :3000         │     │   :8000          │     │   :6333         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Groq LLM      │
                        │   (Llama 3.1)   │
                        └─────────────────┘
```

**RAG Flow:**
1. Policy docs (`/data/*.md`) are chunked and embedded using a local hash-based embedder
2. Embeddings stored in Qdrant vector database
3. On query, top-k relevant chunks retrieved via cosine similarity
4. Retrieved chunks passed to Groq LLM (Llama 3.1) for answer generation
5. Response returned with citations (doc title + section) and raw chunks

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Groq API key (free at https://console.groq.com)

### Setup
```bash
# 1. Clone the repo
git clone https://github.com/dark9TLight/ai-policy-helper-starter-pack.git
cd ai-policy-helper-starter-pack

# Get your FREE Groq API key at: https://console.groq.com/keys
# Sign up → API Keys → Create Key → Copy it
nano .env  # Replace GROQ_API_KEY=your-groq-api-key-here with your real key

# 2. Start all services
docker compose up --build
```

### Access
| Service | URL |
|---|---|
| Chat UI | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| Qdrant UI | http://localhost:6333/dashboard |

### Ingest Documents
Click **"Ingest sample docs"** in the Admin panel, or:
```bash
curl -X POST http://localhost:8000/api/ingest
```

### Ask Questions
```bash
curl -X POST http://localhost:8000/api/ask \
  -H 'Content-Type: application/json' \
  -d '{"query": "Can a customer return a damaged blender after 20 days?"}'
```

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/ingest` | POST | Ingest all docs from `/data` folder |
| `/api/ask` | POST | Ask a question, returns answer + citations |
| `/api/metrics` | GET | Retrieval/generation latency + model info |
| `/api/health` | GET | Health check |

### Ask Request/Response
```json
// Request
{ "query": "What is the return policy?", "k": 4 }

// Response
{
  "answer": "Based on Returns_and_Refunds.md...",
  "citations": [{"title": "Returns_and_Refunds.md", "section": "Conditions"}],
  "chunks": [...],
  "metrics": {"retrieval_ms": 12.3, "generation_ms": 450.1}
}
```

## Project Structure
```
ai-policy-helper/
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI routes
│   │   ├── rag.py        # RAG engine (embeddings, retrieval, LLM)
│   │   ├── ingest.py     # Document chunker
│   │   ├── models.py     # Pydantic schemas
│   │   ├── settings.py   # Config from env
│   │   └── tests/        # pytest tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/page.tsx      # Main page
│   ├── components/
│   │   ├── Chat.tsx      # Chat interface
│   │   └── AdminPanel.tsx
│   └── lib/api.ts        # API client
├── data/                 # Policy documents
├── docker-compose.yml
└── .env.example
```

## LLM Configuration

| Provider | Setting | Notes |
|---|---|---|
| **Groq** (default) | `LLM_PROVIDER=groq` | Free, fast, no credit card |
| OpenRouter | `LLM_PROVIDER=openrouter` | Paid, GPT-4o-mini |
| Stub | `LLM_PROVIDER=stub` | Offline, deterministic |

To switch providers, update `.env` and restart:
```bash
docker compose down && docker compose up
```

## Running Tests
```bash
docker compose run --rm backend pytest -q
```

## Trade-offs & Decisions

**Embeddings:** Used a local hash-based embedder (no external API needed) instead of OpenAI embeddings. This keeps the app fully offline-capable but sacrifices semantic accuracy. A production system would use `text-embedding-3-small` or similar.

**LLM Provider:** Switched from OpenRouter to Groq for zero-cost local development. Groq's Llama 3.1 8B provides good quality answers for policy Q&A at no cost with generous rate limits.

**Chunking:** Fixed-size chunking (700 tokens, 80 overlap) is simple but loses context at boundaries. Production would use semantic/paragraph-aware chunking.

**Vector Store:** Qdrant via Docker for persistence. Falls back to in-memory if Qdrant unavailable, ensuring the app always works.

**Citations:** Returned as both source badges (doc + section) and expandable raw chunks, giving users full transparency into the retrieval.

## What I'd Ship Next

- Semantic embeddings (replace hash-based with real model)
- Streaming responses for better UX
- Re-ranking (MMR) for more diverse retrieved chunks
- Feedback logging (thumbs up/down) for continuous improvement
- PDPA guardrails (mask IC numbers, addresses in responses)
- Upload UI for custom documents
- Eval script to measure retrieval accuracy

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `stub` | LLM provider: `groq`, `openrouter`, `stub` |
| `GROQ_API_KEY` | - | Groq API key (get free at console.groq.com) |
| `LLM_MODEL` | `llama-3.1-8b-instant` | Model name |
| `VECTOR_STORE` | `qdrant` | Vector store: `qdrant` or `memory` |
| `EMBEDDING_MODEL` | `local-384` | Embedding model |
| `CHUNK_SIZE` | `700` | Chunk size in characters |
| `CHUNK_OVERLAP` | `80` | Chunk overlap in characters |
