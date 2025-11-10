# Pull Request: Add conversation export feature for semantic search and pattern analysis

## PR Title
```
Add conversation export feature for semantic search and pattern analysis
```

## PR Description

```markdown
## Summary

This PR adds a comprehensive export feature that allows users to export all their Cursor conversations in a structured JSON format optimized for semantic search, pattern analysis, and building RAG (Retrieval-Augmented Generation) systems.

**Updated for compatibility with the latest codebase:**
- Uses `better-sqlite3` instead of `sqlite3`
- Compatible with new ChatTab structure
- Adapted to current navbar structure

## Features Added

### 1. Export API Endpoint (`/api/export`)
- Exports all conversations (both Chat and Composer) in structured JSON format
- Uses `better-sqlite3` for database access (compatible with updated codebase)
- Query parameters to filter by type:
  - `includeChats=true/false` - Include AI Chat logs
  - `includeComposers=true/false` - Include Composer/Agent logs
- Rich metadata for each conversation and message
- Automatic statistics calculation

### 2. Export UI Page (`/export`)
- User-friendly interface to trigger exports
- Three export options:
  - Export everything (Chat + Composer)
  - Export Composer only
  - Export Chat only
- Automatic file download with timestamped filename
- Post-export statistics display
- Usage examples and next steps

### 3. Comprehensive Documentation
- **EXPORT_GUIDE.md**: Complete guide with Python examples for:
  - Semantic search with OpenAI embeddings
  - Pattern analysis with Pandas
  - Vector database integration (Pinecone, Qdrant, ChromaDB, Weaviate)
  - Building RAG systems with LangChain
  - Extracting best practices and methodologies
- Updated **README.md** with export feature documentation

### 4. Navigation Integration
- Added "Export" link to the main navigation bar
- Active state indication for the export page

## JSON Export Structure

Each export includes:
```json
{
  "exportedAt": "ISO timestamp",
  "totalConversations": 42,
  "totalMessages": 856,
  "conversations": [
    {
      "id": "unique-id",
      "type": "composer" | "chat",
      "title": "Conversation title",
      "messages": [
        {
          "role": "user" | "assistant",
          "content": "Message text",
          "timestamp": 1704362000000,
          "formattedTimestamp": "ISO date",
          "context": {
            "codeSelections": ["selected code"],
            "files": ["/path/to/file"],
            "folders": ["/path/to/folder"],
            "docs": [{"title": "...", "content": "..."}],
            "commits": [{"hash": "...", "message": "..."}]
          },
          "metadata": { ... }
        }
      ],
      "summary": {
        "messageCount": 12,
        "userMessageCount": 6,
        "assistantMessageCount": 6,
        "hasCodeContext": true,
        "filesReferenced": ["/src/file.ts"],
        "averageMessageLength": 342
      },
      "workspace": {
        "id": "workspace-hash",
        "folder": "/path/to/project"
      },
      "createdAt": 1704362000000,
      "lastUpdatedAt": 1704362500000
    }
  ]
}
```

## Use Cases

1. **Semantic Search**
   - Create embeddings with OpenAI, Cohere, or local models
   - Store in vector databases (Pinecone, Qdrant, Weaviate, ChromaDB)
   - Find similar questions and best answers by semantic similarity

2. **Pattern Analysis**
   - Identify which prompting strategies work best
   - Analyze conversation characteristics (length, context, success rate)
   - Extract insights about effective questioning techniques

3. **RAG Systems**
   - Build custom retrieval-augmented generation systems
   - Use your best conversations as context for future queries
   - Create a personalized AI assistant trained on your methodology

4. **Documentation**
   - Automatically generate documentation from successful conversations
   - Extract and catalog best practices
   - Build a knowledge base of proven solutions

5. **Training Data**
   - Fine-tune models on your interaction patterns
   - Create custom datasets for specific domains
   - Improve prompting strategies based on historical data

## Files Changed

- `src/app/api/export/route.ts` - New API endpoint for data export (using better-sqlite3)
- `src/app/export/page.tsx` - New export UI page
- `src/components/navbar.tsx` - Added Export link to navigation
- `EXPORT_GUIDE.md` - Comprehensive guide with examples
- `README.md` - Updated with export feature documentation

## Technical Updates

- **Database**: Uses `better-sqlite3` instead of `sqlite3` for compatibility
- **Types**: Compatible with updated ChatTab structure (timestamp as number)
- **UI**: Adapted to current simplified navbar structure

## Testing

To test the feature:

1. Start the development server: `npm run dev`
2. Navigate to http://localhost:3000/export
3. Click "Exporter Tout" to download the JSON file
4. Or use the API directly: `curl http://localhost:3000/api/export > export.json`

## Example Python Usage

```python
import json
from openai import OpenAI

# Load exported data
with open('export.json') as f:
    data = json.load(f)

# Create embeddings for semantic search
client = OpenAI()
for conv in data['conversations']:
    for msg in conv['messages']:
        if msg['role'] == 'user':
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=msg['content']
            )
            # Store embedding in vector database
```

See `EXPORT_GUIDE.md` for complete examples.

## Benefits

- 🔍 **Find Best Answers**: Semantic search to quickly find relevant past solutions
- 📊 **Improve Prompting**: Analyze which questions lead to better responses
- 🤖 **Build Custom RAG**: Create personalized AI systems based on your data
- 📚 **Generate Docs**: Extract best practices and methodologies automatically
- 🎯 **Pattern Recognition**: Understand what works and what doesn't

## Next Steps

After this PR is merged, users can:
1. Export their conversation data
2. Follow the examples in `EXPORT_GUIDE.md`
3. Build custom tools for semantic search and analysis
4. Share insights about effective prompting strategies

---

This feature enables users to leverage their conversation history in powerful new ways, turning raw chat logs into actionable insights and reusable knowledge.
```

## Branch Information

- **Base branch**: `main`
- **Head branch**: `claude/export-conversation-data-011CUojEkwZb6L3wPSKBiuzn`
- **Commit**: `58b923f Add conversation export feature for semantic search and pattern analysis`

## To Create the PR

### Method: GitHub Web UI (Recommended)

Visit this URL to create the PR:
```
https://github.com/AntoineMaitre/cursor-chat-browser/compare/main...claude/export-conversation-data-011CUojEkwZb6L3wPSKBiuzn
```

Then copy and paste the PR description from above.

The branch has been updated to work with the latest codebase including the migration to `better-sqlite3` and other recent changes.
