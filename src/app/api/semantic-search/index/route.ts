import { NextResponse } from 'next/server'

/**
 * Index conversations for semantic search
 * Forwards export data to Python backend for embedding creation
 */

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const exportData = await request.json()

    // Forward to Python backend for indexing
    const response = await fetch(`${PYTHON_BACKEND_URL}/index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ export_data: exportData }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || 'Indexing failed' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Indexing error:', error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          error: 'Python backend not available',
          message: 'Make sure the Python backend is running at ' + PYTHON_BACKEND_URL,
          hint: 'Run: cd python-backend && python app.py',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/index`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || 'Clear index failed' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Clear index error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
