"""
Secure Local Python Backend for Cursor Chat Browser
Provides semantic search capabilities using embeddings
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import numpy as np
from openai import OpenAI
import os
from dotenv import load_dotenv
import pickle
from pathlib import Path

load_dotenv()

app = FastAPI(title="Cursor Chat Semantic Search API")

# CORS - restrict to localhost only for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Only Next.js frontend
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Storage paths
EMBEDDINGS_FILE = Path("data/embeddings.pkl")
CONVERSATIONS_FILE = Path("data/conversations_cache.json")

# Ensure data directory exists
EMBEDDINGS_FILE.parent.mkdir(exist_ok=True)


class SemanticSearchRequest(BaseModel):
    query: str
    top_k: int = 5
    filter_type: Optional[str] = None  # 'chat' or 'composer'
    min_score: float = 0.7


class IndexRequest(BaseModel):
    export_data: Dict[str, Any]  # The exported JSON from /api/export


class SearchResult(BaseModel):
    conversation_id: str
    conversation_title: str
    message_content: str
    message_role: str
    similarity_score: float
    timestamp: int
    type: str
    workspace_folder: Optional[str]
    full_conversation: Optional[Dict] = None


@app.get("/")
async def root():
    return {
        "service": "Cursor Chat Semantic Search",
        "status": "running",
        "version": "1.0.0",
        "indexed_conversations": get_indexed_count()
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    has_embeddings = EMBEDDINGS_FILE.exists()
    return {
        "status": "healthy",
        "embeddings_indexed": has_embeddings,
        "conversation_count": get_indexed_count()
    }


@app.post("/index")
async def index_conversations(request: IndexRequest):
    """
    Index conversations from exported data
    Creates embeddings for all messages
    """
    try:
        data = request.export_data
        conversations = data.get('conversations', [])

        embeddings_data = []
        conversation_map = {}

        print(f"Indexing {len(conversations)} conversations...")

        for conv in conversations:
            # Store full conversation for retrieval
            conversation_map[conv['id']] = conv

            for msg in conv['messages']:
                # Create embeddings for all messages (both user and assistant)
                # This allows finding both questions and answers
                content = msg['content']

                if not content or len(content.strip()) < 10:
                    continue  # Skip empty or very short messages

                # Create embedding
                response = openai_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=content
                )

                embeddings_data.append({
                    'embedding': response.data[0].embedding,
                    'conversation_id': conv['id'],
                    'conversation_title': conv['title'],
                    'conversation_type': conv['type'],
                    'message_id': msg['id'],
                    'message_content': content,
                    'message_role': msg['role'],
                    'timestamp': msg['timestamp'],
                    'workspace_folder': conv['workspace'].get('folder')
                })

                print(f"Indexed message {len(embeddings_data)}", end='\r')

        # Save embeddings
        with open(EMBEDDINGS_FILE, 'wb') as f:
            pickle.dump(embeddings_data, f)

        # Save conversation map for quick retrieval
        with open(CONVERSATIONS_FILE, 'w') as f:
            json.dump(conversation_map, f)

        print(f"\n✓ Indexed {len(embeddings_data)} messages from {len(conversations)} conversations")

        return {
            "status": "success",
            "indexed_messages": len(embeddings_data),
            "indexed_conversations": len(conversations)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search", response_model=List[SearchResult])
async def semantic_search(request: SemanticSearchRequest):
    """
    Perform semantic search across indexed conversations
    """
    try:
        # Check if embeddings exist
        if not EMBEDDINGS_FILE.exists():
            raise HTTPException(
                status_code=404,
                detail="No embeddings found. Please index conversations first using /index endpoint"
            )

        # Load embeddings
        with open(EMBEDDINGS_FILE, 'rb') as f:
            embeddings_data = pickle.load(f)

        # Load conversation map
        with open(CONVERSATIONS_FILE, 'r') as f:
            conversation_map = json.load(f)

        # Create query embedding
        query_response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=request.query
        )
        query_embedding = np.array(query_response.data[0].embedding)

        # Calculate cosine similarity for all embeddings
        results = []
        for item in embeddings_data:
            # Apply type filter if specified
            if request.filter_type and item['conversation_type'] != request.filter_type:
                continue

            embedding = np.array(item['embedding'])
            similarity = np.dot(query_embedding, embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(embedding)
            )

            if similarity >= request.min_score:
                results.append({
                    'conversation_id': item['conversation_id'],
                    'conversation_title': item['conversation_title'],
                    'message_content': item['message_content'],
                    'message_role': item['message_role'],
                    'similarity_score': float(similarity),
                    'timestamp': item['timestamp'],
                    'type': item['conversation_type'],
                    'workspace_folder': item['workspace_folder'],
                    'full_conversation': conversation_map.get(item['conversation_id'])
                })

        # Sort by similarity score
        results.sort(key=lambda x: x['similarity_score'], reverse=True)

        # Return top K results
        return results[:request.top_k]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """
    Retrieve full conversation by ID
    """
    try:
        if not CONVERSATIONS_FILE.exists():
            raise HTTPException(status_code=404, detail="No conversations indexed")

        with open(CONVERSATIONS_FILE, 'r') as f:
            conversation_map = json.load(f)

        if conversation_id not in conversation_map:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return conversation_map[conversation_id]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/index")
async def clear_index():
    """
    Clear all indexed data
    """
    try:
        if EMBEDDINGS_FILE.exists():
            EMBEDDINGS_FILE.unlink()
        if CONVERSATIONS_FILE.exists():
            CONVERSATIONS_FILE.unlink()

        return {"status": "success", "message": "Index cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_indexed_count() -> int:
    """Get count of indexed conversations"""
    try:
        if CONVERSATIONS_FILE.exists():
            with open(CONVERSATIONS_FILE, 'r') as f:
                data = json.load(f)
            return len(data)
        return 0
    except:
        return 0


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",  # localhost only - not exposed to internet
        port=8000,
        log_level="info"
    )
