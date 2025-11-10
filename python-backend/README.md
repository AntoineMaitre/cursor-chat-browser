# Python Semantic Search Backend

Local-only Python backend for semantic search on Cursor conversations.

## Security Features

- 🔒 **Localhost only** - Binds to 127.0.0.1, not accessible from network
- 🔒 **CORS restricted** - Only accepts requests from Next.js frontend
- 🔒 **No data upload** - All processing happens locally on your machine
- 🔒 **API keys in .env** - Never committed to version control

## Setup

1. **Install Python dependencies:**

```bash
cd python-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment:**

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

3. **Start the server:**

```bash
python app.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```bash
GET http://localhost:8000/health
```

### Index Conversations
```bash
POST http://localhost:8000/index
Content-Type: application/json

{
  "export_data": { ... }  # Export from /api/export
}
```

### Semantic Search
```bash
POST http://localhost:8000/search
Content-Type: application/json

{
  "query": "How do I implement authentication?",
  "top_k": 5,
  "filter_type": "composer",  # optional: "chat" or "composer"
  "min_score": 0.7
}
```

### Get Full Conversation
```bash
GET http://localhost:8000/conversations/{conversation_id}
```

### Clear Index
```bash
DELETE http://localhost:8000/index
```

## Usage Flow

1. **Export conversations** from Next.js app (`/export` page)
2. **Index the data** by POSTing the export JSON to `/index`
3. **Search semantically** using `/search` endpoint
4. Results include **full conversation context**

## Integration with Next.js

Add a new API route in Next.js to proxy to Python backend:

```typescript
// src/app/api/semantic-search/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch('http://localhost:8000/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return Response.json(await response.json());
}
```

## Data Privacy

- All data stays on your local machine
- Embeddings are cached locally in `data/embeddings.pkl`
- Only message content is sent to OpenAI for embedding (not stored by OpenAI per their policy)
- No telemetry or external logging

## Performance

- **Indexing**: ~100 messages/minute (depends on OpenAI API rate limits)
- **Search**: < 100ms for 10,000 indexed messages
- **Storage**: ~5KB per message (embeddings + metadata)
