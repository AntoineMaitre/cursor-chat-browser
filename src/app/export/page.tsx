"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, FileJson, Database, TrendingUp } from 'lucide-react'

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportData, setExportData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (includeChats = true, includeComposers = true) => {
    setIsExporting(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        includeChats: includeChats.toString(),
        includeComposers: includeComposers.toString()
      })

      const response = await fetch(`/api/export?${params}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const data = await response.json()
      setExportData(data)

      // Automatically download the JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cursor-conversations-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">Export Conversations</h1>
      <p className="text-muted-foreground mb-8">
        Exportez vos conversations pour la recherche sémantique, l'analyse de patterns et la création d'une base documentaire.
      </p>

      <div className="grid gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileJson className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Format JSON Structuré</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Les données sont exportées dans un format JSON optimisé pour:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                <li>Recherche sémantique avec embeddings (OpenAI, Cohere, etc.)</li>
                <li>Ingestion dans des bases vectorielles (Pinecone, Weaviate, Qdrant)</li>
                <li>Analyse de patterns et méthodologies</li>
                <li>Création de documentation à partir des meilleures pratiques</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Contenu de l'Export</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Chaque conversation inclut:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><strong>Messages:</strong> Contenu complet avec rôle (user/assistant)</li>
                <li><strong>Timestamps:</strong> Dates de création et mise à jour</li>
                <li><strong>Contexte:</strong> Sélections de code, fichiers, commits référencés</li>
                <li><strong>Métadonnées:</strong> Type de modèle, workspace, statistiques</li>
                <li><strong>Statistiques:</strong> Nombre de messages, longueur moyenne, fichiers référencés</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Cas d'Usage</h2>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Créer un RAG (Retrieval Augmented Generation) personnalisé</li>
                <li>Analyser quelles questions obtiennent les meilleures réponses</li>
                <li>Identifier les patterns de prompts efficaces</li>
                <li>Construire une base de connaissances de vos meilleures méthodologies</li>
                <li>Former un modèle personnalisé sur vos interactions</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Options d'Export</h2>
        <div className="space-y-3">
          <Button
            onClick={() => handleExport(true, true)}
            disabled={isExporting}
            className="w-full justify-start"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            {isExporting ? 'Export en cours...' : 'Exporter Tout (Composer + Chat)'}
          </Button>

          <Button
            onClick={() => handleExport(false, true)}
            disabled={isExporting}
            variant="outline"
            className="w-full justify-start"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Exporter uniquement Composer (Agent)
          </Button>

          <Button
            onClick={() => handleExport(true, false)}
            disabled={isExporting}
            variant="outline"
            className="w-full justify-start"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Exporter uniquement Chat
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive mb-6">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {exportData && (
        <Card className="p-6 bg-muted">
          <h2 className="text-xl font-semibold mb-4">Export Réussi ✓</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Conversations exportées:</p>
              <p className="text-2xl font-bold">{exportData.totalConversations}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Messages totaux:</p>
              <p className="text-2xl font-bold">{exportData.totalMessages}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Exporté le:</p>
              <p className="font-mono text-sm">{exportData.exportedAt}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-background rounded-lg">
            <h3 className="font-semibold mb-2">Prochaines étapes suggérées:</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>Utilisez OpenAI embeddings pour vectoriser les messages</li>
              <li>Stockez dans une base vectorielle (Pinecone, Qdrant, ChromaDB)</li>
              <li>Créez un système de recherche sémantique</li>
              <li>Analysez les patterns avec Python/Pandas ou LLM</li>
              <li>Générez une documentation des meilleures pratiques</li>
            </ol>
          </div>
        </Card>
      )}

      <Card className="p-6 mt-6 bg-muted/50">
        <h2 className="text-lg font-semibold mb-3">Exemple de Code Python pour l'Analyse</h2>
        <pre className="text-xs bg-background p-4 rounded-lg overflow-x-auto">
{`import json
import pandas as pd
from openai import OpenAI

# Charger les données exportées
with open('cursor-conversations-2025-01-04.json') as f:
    data = json.load(f)

# Créer un DataFrame pour l'analyse
messages = []
for conv in data['conversations']:
    for msg in conv['messages']:
        messages.append({
            'conversation_id': conv['id'],
            'role': msg['role'],
            'content': msg['content'],
            'timestamp': msg['timestamp'],
            'has_code_context': conv['summary']['hasCodeContext']
        })

df = pd.DataFrame(messages)

# Analyser les patterns
print("Messages par type:")
print(df['role'].value_counts())

print("\\nLongueur moyenne par rôle:")
df['length'] = df['content'].str.len()
print(df.groupby('role')['length'].mean())

# Générer des embeddings pour la recherche sémantique
client = OpenAI()
user_messages = df[df['role'] == 'user']['content'].tolist()

embeddings = []
for msg in user_messages[:10]:  # Exemple sur 10 messages
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=msg
    )
    embeddings.append(response.data[0].embedding)

# Sauvegarder pour une base vectorielle
# ... votre code pour Pinecone, Qdrant, etc.`}
        </pre>
      </Card>
    </div>
  )
}
