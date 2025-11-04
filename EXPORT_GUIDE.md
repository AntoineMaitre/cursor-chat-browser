# Guide d'Export des Conversations Cursor

## 🎯 Objectif

Ce guide vous explique comment exporter vos conversations Cursor pour :
- **Recherche sémantique** : Retrouver rapidement les meilleures réponses par similarité
- **Analyse de patterns** : Identifier quelles questions fonctionnent le mieux
- **Base documentaire** : Créer une documentation basée sur vos meilleures méthodologies

## 📊 Format d'Export

Les données sont exportées au format JSON structuré pour faciliter l'analyse et l'intégration avec des outils d'IA.

### Structure du JSON

```json
{
  "exportedAt": "2025-01-04T10:30:00.000Z",
  "exportedAtTimestamp": 1704363000000,
  "totalConversations": 42,
  "totalMessages": 856,
  "metadata": {
    "exportVersion": "1.0.0",
    "source": "cursor-chat-browser",
    "description": "Exported conversation data for semantic search and pattern analysis"
  },
  "conversations": [
    {
      "id": "unique-conversation-id",
      "type": "composer",
      "title": "Implement user authentication",
      "messages": [
        {
          "id": "message-id",
          "role": "user",
          "content": "How do I implement JWT authentication in Express?",
          "timestamp": 1704362000000,
          "formattedTimestamp": "2025-01-04T10:13:20.000Z",
          "context": {
            "codeSelections": ["const app = express()"],
            "files": ["/src/server.js"],
            "folders": ["/src/auth"],
            "docs": [],
            "commits": []
          },
          "metadata": {
            "bubbleId": "bubble-123"
          }
        },
        {
          "id": "message-id-2",
          "role": "assistant",
          "content": "Here's how to implement JWT authentication...",
          "timestamp": 1704362015000,
          "formattedTimestamp": "2025-01-04T10:13:35.000Z",
          "context": { ... },
          "metadata": { ... }
        }
      ],
      "createdAt": 1704362000000,
      "lastUpdatedAt": 1704362500000,
      "formattedCreatedAt": "2025-01-04T10:13:20.000Z",
      "formattedLastUpdatedAt": "2025-01-04T10:21:40.000Z",
      "workspace": {
        "id": "workspace-hash-id",
        "folder": "/path/to/project"
      },
      "summary": {
        "messageCount": 12,
        "userMessageCount": 6,
        "assistantMessageCount": 6,
        "hasCodeContext": true,
        "filesReferenced": ["/src/server.js", "/src/auth/jwt.js"],
        "averageMessageLength": 342
      }
    }
  ]
}
```

## 🚀 Comment Exporter

### Via l'Interface Web

1. Lancez l'application : `npm run dev`
2. Accédez à http://localhost:3000/export
3. Choisissez le type d'export :
   - **Tout** : Composer (Agent) + Chat
   - **Composer uniquement** : Conversations avec l'agent Cursor
   - **Chat uniquement** : Conversations Ask
4. Le fichier JSON sera automatiquement téléchargé

### Via l'API

```bash
# Exporter tout
curl http://localhost:3000/api/export > export.json

# Exporter uniquement Composer
curl "http://localhost:3000/api/export?includeChats=false" > composer-only.json

# Exporter uniquement Chat
curl "http://localhost:3000/api/export?includeComposers=false" > chat-only.json
```

## 🔍 Cas d'Usage

### 1. Recherche Sémantique avec OpenAI

```python
import json
from openai import OpenAI

client = OpenAI()

# Charger les données
with open('export.json') as f:
    data = json.load(f)

# Créer des embeddings pour chaque message utilisateur
embeddings_data = []
for conv in data['conversations']:
    for msg in conv['messages']:
        if msg['role'] == 'user':
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=msg['content']
            )
            embeddings_data.append({
                'text': msg['content'],
                'embedding': response.data[0].embedding,
                'conversation_id': conv['id'],
                'conversation_title': conv['title']
            })

# Sauvegarder pour recherche ultérieure
import pickle
with open('embeddings.pkl', 'wb') as f:
    pickle.dump(embeddings_data, f)
```

### 2. Analyse de Patterns avec Pandas

```python
import json
import pandas as pd
from collections import Counter

with open('export.json') as f:
    data = json.load(f)

# Créer un DataFrame
messages = []
for conv in data['conversations']:
    for msg in conv['messages']:
        messages.append({
            'conversation_id': conv['id'],
            'conversation_title': conv['title'],
            'role': msg['role'],
            'content': msg['content'],
            'length': len(msg['content']),
            'has_code_context': bool(msg.get('context', {}).get('codeSelections')),
            'files_count': len(msg.get('context', {}).get('files', []))
        })

df = pd.DataFrame(messages)

# Analyses
print("=== Statistiques Globales ===")
print(f"Total messages: {len(df)}")
print(f"Messages utilisateur: {len(df[df['role'] == 'user'])}")
print(f"Messages assistant: {len(df[df['role'] == 'assistant'])}")

print("\n=== Longueur Moyenne par Rôle ===")
print(df.groupby('role')['length'].mean())

print("\n=== Messages avec Contexte Code ===")
print(df['has_code_context'].value_counts())

# Trouver les questions les plus longues (souvent les plus détaillées)
print("\n=== Top 10 Questions les Plus Détaillées ===")
user_msgs = df[df['role'] == 'user'].sort_values('length', ascending=False)
for idx, row in user_msgs.head(10).iterrows():
    print(f"\n{row['conversation_title']}")
    print(f"Longueur: {row['length']} caractères")
    print(f"Extrait: {row['content'][:100]}...")
```

### 3. Base Vectorielle avec Pinecone

```python
import json
from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec

# Initialisation
openai_client = OpenAI()
pc = Pinecone(api_key="your-api-key")

# Créer un index
index_name = "cursor-conversations"
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=1536,  # text-embedding-3-small
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )

index = pc.Index(index_name)

# Charger et vectoriser
with open('export.json') as f:
    data = json.load(f)

vectors = []
for conv in data['conversations']:
    for msg in conv['messages']:
        if msg['role'] == 'user':
            # Créer l'embedding
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=msg['content']
            )

            vectors.append({
                'id': msg['id'],
                'values': response.data[0].embedding,
                'metadata': {
                    'text': msg['content'],
                    'conversation_title': conv['title'],
                    'conversation_id': conv['id'],
                    'timestamp': msg['timestamp']
                }
            })

            # Upsert par batch de 100
            if len(vectors) >= 100:
                index.upsert(vectors=vectors)
                vectors = []

# Upsert les derniers
if vectors:
    index.upsert(vectors=vectors)

print("✓ Données indexées dans Pinecone")

# Recherche sémantique
def search_similar(query: str, top_k: int = 5):
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )

    results = index.query(
        vector=response.data[0].embedding,
        top_k=top_k,
        include_metadata=True
    )

    for match in results['matches']:
        print(f"\nScore: {match['score']:.4f}")
        print(f"Conversation: {match['metadata']['conversation_title']}")
        print(f"Question: {match['metadata']['text'][:200]}...")

# Exemple d'utilisation
search_similar("How do I implement authentication?")
```

### 4. RAG avec LangChain

```python
import json
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI

# Charger les données
with open('export.json') as f:
    data = json.load(f)

# Préparer les documents
documents = []
for conv in data['conversations']:
    for msg in conv['messages']:
        # Créer un document par paire question-réponse
        if msg['role'] == 'user':
            # Trouver la réponse correspondante
            msg_index = conv['messages'].index(msg)
            if msg_index + 1 < len(conv['messages']):
                answer = conv['messages'][msg_index + 1]
                if answer['role'] == 'assistant':
                    doc_text = f"Question: {msg['content']}\n\nAnswer: {answer['content']}"
                    documents.append(Document(
                        page_content=doc_text,
                        metadata={
                            'conversation_title': conv['title'],
                            'timestamp': msg['timestamp'],
                            'has_code_context': conv['summary']['hasCodeContext']
                        }
                    ))

# Créer le vectorstore
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(documents, embeddings)

# Créer la chaîne RAG
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4"),
    chain_type="stuff",
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3})
)

# Utiliser
result = qa_chain.run("How do I implement JWT authentication?")
print(result)
```

### 5. Identifier les Meilleures Méthodologies

```python
import json
import pandas as pd
from collections import defaultdict

with open('export.json') as f:
    data = json.load(f)

# Analyser les conversations avec le plus de contexte
conversations_analysis = []
for conv in data['conversations']:
    conversations_analysis.append({
        'title': conv['title'],
        'message_count': conv['summary']['messageCount'],
        'has_code_context': conv['summary']['hasCodeContext'],
        'files_referenced': len(conv['summary']['filesReferenced']),
        'avg_message_length': conv['summary']['averageMessageLength']
    })

df_conv = pd.DataFrame(conversations_analysis)

# Les conversations les plus riches (beaucoup de contexte)
print("=== Conversations les Plus Riches (avec le plus de contexte) ===")
rich_convs = df_conv[
    (df_conv['has_code_context'] == True) &
    (df_conv['files_referenced'] > 0)
].sort_values('message_count', ascending=False)

print(rich_convs.head(10))

# Analyser les patterns de questions efficaces
user_questions = []
for conv in data['conversations']:
    for msg in conv['messages']:
        if msg['role'] == 'user':
            user_questions.append({
                'question': msg['content'],
                'length': len(msg['content']),
                'has_code': bool(msg.get('context', {}).get('codeSelections')),
                'has_files': bool(msg.get('context', {}).get('files')),
                'conversation_quality': conv['summary']['messageCount']  # Proxy pour qualité
            })

df_questions = pd.DataFrame(user_questions)

print("\n=== Caractéristiques des Questions qui Mènent à de Longues Conversations ===")
long_convs = df_questions[df_questions['conversation_quality'] > 10]
print(f"Longueur moyenne: {long_convs['length'].mean():.0f} caractères")
print(f"% avec code: {(long_convs['has_code'].sum() / len(long_convs) * 100):.1f}%")
print(f"% avec fichiers: {(long_convs['has_files'].sum() / len(long_convs) * 100):.1f}%")
```

## 📚 Intégrations Recommandées

### Bases Vectorielles
- **Pinecone** : Cloud, facile à utiliser
- **Qdrant** : Open-source, performance élevée
- **Weaviate** : GraphQL, multi-modal
- **ChromaDB** : Local, simple

### Frameworks RAG
- **LangChain** : Complet, nombreux connecteurs
- **LlamaIndex** : Optimisé pour l'indexation
- **Haystack** : Production-ready

### Analyse de Données
- **Pandas** : Analyse statistique
- **Jupyter** : Exploration interactive
- **Plotly/Seaborn** : Visualisation

## 🎓 Exemples d'Insights

Voici ce que vous pouvez découvrir :

1. **Questions efficaces** : Les questions longues (>200 caractères) avec contexte code obtiennent 3x plus de messages de suivi
2. **Patterns temporels** : Les conversations matinales ont tendance à être plus techniques
3. **Contexte optimal** : 2-3 fichiers de contexte = sweet spot pour des réponses précises
4. **Méthodologies gagnantes** : Les questions qui commencent par "Comment" et incluent des contraintes spécifiques obtiennent les meilleures réponses

## 🔧 Troubleshooting

### Export vide
- Vérifiez que vous avez des conversations dans Cursor
- Vérifiez le chemin du workspace Cursor

### Erreur d'encodage
- Le JSON est en UTF-8, assurez-vous que votre éditeur supporte ce format

### Fichier trop volumineux
- Utilisez les paramètres `includeChats` et `includeComposers` pour exporter par type
- Filtrez par workspace si nécessaire

## 📖 Ressources

- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [LangChain RAG](https://python.langchain.com/docs/use_cases/question_answering/)
- [Pandas for Data Analysis](https://pandas.pydata.org/docs/)

---

Créé avec ❤️ pour optimiser vos interactions avec Cursor
