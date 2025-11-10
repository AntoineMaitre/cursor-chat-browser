import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import Database from 'better-sqlite3'
import { ComposerChat, ComposerData, ChatTab } from '@/types/workspace'
import { resolveWorkspacePath } from '@/utils/workspace-path'

// Export format optimized for semantic search and pattern analysis
export interface ExportedMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  formattedTimestamp: string
  context?: {
    codeSelections?: string[]
    files?: string[]
    folders?: string[]
    docs?: Array<{ title: string; content: string }>
    commits?: Array<{ hash: string; message: string }>
  }
  metadata?: {
    modelType?: string
    bubbleId?: string
  }
}

export interface ExportedConversation {
  id: string
  type: 'composer' | 'chat'
  title: string
  messages: ExportedMessage[]
  createdAt: number
  lastUpdatedAt: number
  formattedCreatedAt: string
  formattedLastUpdatedAt: string
  workspace: {
    id: string
    folder?: string
  }
  summary: {
    messageCount: number
    userMessageCount: number
    assistantMessageCount: number
    hasCodeContext: boolean
    filesReferenced: string[]
    averageMessageLength: number
  }
}

export interface ExportData {
  exportedAt: string
  exportedAtTimestamp: number
  totalConversations: number
  totalMessages: number
  conversations: ExportedConversation[]
  metadata: {
    exportVersion: string
    source: string
    description: string
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

function extractFilePaths(composer: ComposerChat): string[] {
  const files = new Set<string>()

  // From main context
  if (composer.context?.fileSelections) {
    composer.context.fileSelections.forEach(file => {
      if (file.uri?.fsPath) {
        files.add(file.uri.fsPath)
      }
    })
  }

  // From conversation messages
  if (composer.conversation) {
    composer.conversation.forEach(msg => {
      if (msg.context?.fileSelections) {
        msg.context.fileSelections.forEach(file => {
          if (file.uri?.fsPath) {
            files.add(file.uri.fsPath)
          }
        })
      }
    })
  }

  return Array.from(files)
}

function processComposerChat(composer: ComposerChat, workspaceId: string, workspaceFolder?: string): ExportedConversation {
  const messages: ExportedMessage[] = []

  // Process conversation messages
  if (composer.conversation && composer.conversation.length > 0) {
    composer.conversation.forEach(msg => {
      messages.push({
        id: msg.bubbleId,
        role: msg.type === 1 ? 'user' : 'assistant',
        content: msg.text,
        timestamp: msg.timestamp,
        formattedTimestamp: formatTimestamp(msg.timestamp),
        context: {
          codeSelections: msg.context?.selections?.map(s => s.text).filter(Boolean),
          files: msg.context?.fileSelections?.map(f => f.uri?.fsPath).filter(Boolean),
          folders: msg.context?.folderSelections?.map(f => f.path),
          docs: msg.context?.selectedDocs?.map(d => ({ title: d.title, content: d.content })),
          commits: msg.context?.selectedCommits?.map(c => ({ hash: c.hash, message: c.message }))
        },
        metadata: {
          bubbleId: msg.bubbleId
        }
      })
    })
  }

  const userMessages = messages.filter(m => m.role === 'user')
  const assistantMessages = messages.filter(m => m.role === 'assistant')
  const allFiles = extractFilePaths(composer)
  const hasCodeContext = allFiles.length > 0 ||
    (composer.context?.selections && composer.context.selections.length > 0)

  const avgLength = messages.length > 0
    ? messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length
    : 0

  return {
    id: composer.composerId,
    type: 'composer',
    title: composer.name || 'Untitled',
    messages,
    createdAt: composer.createdAt,
    lastUpdatedAt: composer.lastUpdatedAt,
    formattedCreatedAt: formatTimestamp(composer.createdAt),
    formattedLastUpdatedAt: formatTimestamp(composer.lastUpdatedAt),
    workspace: {
      id: workspaceId,
      folder: workspaceFolder
    },
    summary: {
      messageCount: messages.length,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length,
      hasCodeContext,
      filesReferenced: allFiles,
      averageMessageLength: Math.round(avgLength)
    }
  }
}

function processChatTab(chatTab: ChatTab, workspaceId: string, workspaceFolder?: string): ExportedConversation {
  const messages: ExportedMessage[] = []
  const timestamp = chatTab.timestamp

  // Process chat bubbles
  chatTab.bubbles.forEach((bubble, index) => {
    if (bubble.text) {
      messages.push({
        id: `${chatTab.id}-${index}`,
        role: bubble.type === 'ai' ? 'assistant' : 'user',
        content: bubble.text,
        timestamp: bubble.timestamp || (timestamp + index * 1000),
        formattedTimestamp: formatTimestamp(bubble.timestamp || (timestamp + index * 1000)),
        context: {},
        metadata: {}
      })
    }
  })

  const userMessages = messages.filter(m => m.role === 'user')
  const assistantMessages = messages.filter(m => m.role === 'assistant')

  const avgLength = messages.length > 0
    ? messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length
    : 0

  return {
    id: chatTab.id,
    type: 'chat',
    title: chatTab.title,
    messages,
    createdAt: timestamp,
    lastUpdatedAt: timestamp,
    formattedCreatedAt: formatTimestamp(timestamp),
    formattedLastUpdatedAt: formatTimestamp(timestamp),
    workspace: {
      id: workspaceId,
      folder: workspaceFolder
    },
    summary: {
      messageCount: messages.length,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length,
      hasCodeContext: false,
      filesReferenced: [],
      averageMessageLength: Math.round(avgLength)
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeChats = searchParams.get('includeChats') !== 'false'
    const includeComposers = searchParams.get('includeComposers') !== 'false'

    const workspacePath = resolveWorkspacePath()
    const conversations: ExportedConversation[] = []

    const entries = await fs.readdir(workspacePath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dbPath = path.join(workspacePath, entry.name, 'state.vscdb')
        const workspaceJsonPath = path.join(workspacePath, entry.name, 'workspace.json')

        if (!existsSync(dbPath)) continue

        // Get workspace folder info
        let workspaceFolder = undefined
        try {
          const workspaceData = JSON.parse(await fs.readFile(workspaceJsonPath, 'utf-8'))
          workspaceFolder = workspaceData.folder
        } catch (error) {
          console.log(`No workspace.json found for ${entry.name}`)
        }

        const db = new Database(dbPath, { readonly: true })

        // Get composer chats
        if (includeComposers) {
          const composerResult = db.prepare(`
            SELECT value FROM ItemTable
            WHERE [key] = 'composer.composerData'
          `).get()

          if (composerResult && (composerResult as any).value) {
            const composerData = JSON.parse((composerResult as any).value) as ComposerData
            composerData.allComposers.forEach(composer => {
              conversations.push(processComposerChat(composer, entry.name, workspaceFolder))
            })
          }
        }

        // Get chat tabs (AI Chat)
        if (includeChats) {
          const chatResult = db.prepare(`
            SELECT value FROM ItemTable
            WHERE [key] = 'workbench.panel.aichat.view.aichat.chatdata'
          `).get()

          if (chatResult && (chatResult as any).value) {
            const chatData = JSON.parse((chatResult as any).value)
            if (chatData.tabs) {
              chatData.tabs.forEach((tab: ChatTab) => {
                conversations.push(processChatTab(tab, entry.name, workspaceFolder))
              })
            }
          }
        }

        db.close()
      }
    }

    // Sort by last updated
    conversations.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)

    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0)

    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      exportedAtTimestamp: Date.now(),
      totalConversations: conversations.length,
      totalMessages,
      conversations,
      metadata: {
        exportVersion: '1.0.0',
        source: 'cursor-chat-browser',
        description: 'Exported conversation data for semantic search and pattern analysis'
      }
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Failed to export data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
