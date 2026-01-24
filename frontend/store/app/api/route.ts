// Vercel Serverless API Routes - Main API handler (Fallback route)
// Note: Specific routes in subdirectories take precedence
import { NextRequest, NextResponse } from 'next/server'

// This is a fallback route - specific routes in subdirectories should be used instead
export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Not found. Use specific API routes.', success: false }, { status: 404 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Not found. Use specific API routes.', success: false }, { status: 404 })
}



