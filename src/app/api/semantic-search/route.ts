import { NextResponse } from 'next/server'

/**
 * Semantic Search API Proxy
 * Forwards requests to the local Python backend
 */

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch(`${PYTHON_BACKEND_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || 'Search failed' },
        { status: response.status }
      )
    }

    const results = await response.json()
    return NextResponse.json(results)
  } catch (error) {
    console.error('Semantic search error:', error)

    // Check if Python backend is running
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
