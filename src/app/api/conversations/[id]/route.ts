import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { resolveWorkspacePath } from '@/utils/workspace-path'

/**
 * Get full conversation by ID
 *
 * Query parameters:
 * - workspaceId: The workspace ID where the conversation exists
 * - type: 'chat' or 'composer'
 *
 * Example:
 * GET /api/conversations/abc123?workspaceId=workspace-hash&type=composer
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')
  const type = searchParams.get('type') // 'chat' or 'composer'

  if (!workspaceId || !type) {
    return NextResponse.json(
      {
        error: 'Missing required parameters',
        message: 'Both workspaceId and type (chat|composer) are required'
      },
      { status: 400 }
    )
  }

  if (type !== 'chat' && type !== 'composer') {
    return NextResponse.json(
      {
        error: 'Invalid type',
        message: 'type must be either "chat" or "composer"'
      },
      { status: 400 }
    )
  }

  try {
    const workspacePath = resolveWorkspacePath()
    const dbPath = path.join(workspacePath, workspaceId, 'state.vscdb')

    if (!existsSync(dbPath)) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    if (type === 'composer') {
      // Get composer from state.vscdb
      const result = await db.get(`
        SELECT value FROM ItemTable
        WHERE [key] = 'composer.composerData'
      `)

      if (result?.value) {
        const data = JSON.parse(result.value)
        const composer = data.allComposers.find(
          (c: any) => c.composerId === params.id
        )

        if (composer) {
          // Ensure conversation array exists
          if (!Array.isArray(composer.conversation)) {
            composer.conversation = []
          }

          await db.close()
          return NextResponse.json({
            success: true,
            conversation: composer,
            metadata: {
              id: composer.composerId,
              type: 'composer',
              workspaceId
            }
          })
        }
      }
    } else if (type === 'chat') {
      const result = await db.get(`
        SELECT value FROM ItemTable
        WHERE [key] = 'workbench.panel.aichat.view.aichat.chatdata'
      `)

      if (result?.value) {
        const data = JSON.parse(result.value)
        const chat = data.tabs.find((t: any) => t.tabId === params.id)

        if (chat) {
          await db.close()
          return NextResponse.json({
            success: true,
            conversation: chat,
            metadata: {
              id: chat.tabId,
              type: 'chat',
              workspaceId
            }
          })
        }
      }
    }

    await db.close()
    return NextResponse.json(
      {
        error: 'Conversation not found',
        message: `No ${type} conversation found with ID ${params.id} in workspace ${workspaceId}`
      },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch conversation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
