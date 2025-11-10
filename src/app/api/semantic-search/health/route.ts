import { NextResponse } from 'next/server'

/**
 * Check Python backend health and indexing status
 */

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: 'GET',
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          available: false,
          error: 'Backend returned error'
        },
        { status: response.status }
      )
    }

    const health = await response.json()
    return NextResponse.json({
      available: true,
      ...health,
    })
  } catch (error) {
    return NextResponse.json({
      available: false,
      error: 'Backend not reachable',
      backend_url: PYTHON_BACKEND_URL,
      hint: 'Start with: cd python-backend && python app.py',
    })
  }
}
