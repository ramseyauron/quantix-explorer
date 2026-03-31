import { NextRequest, NextResponse } from 'next/server'

const NODE_URL = process.env.NODE_URL || 'http://164.68.118.17:8560'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const url = `${NODE_URL}/${path}`

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 0 },
    })
    const data = await res.json()
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Node unreachable', details: String(err) },
      { status: 503 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const url = `${NODE_URL}/${path}`
  const body = await request.text()

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Node unreachable', details: String(err) },
      { status: 503 }
    )
  }
}
