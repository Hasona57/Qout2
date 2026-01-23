// Vercel Serverless API Routes - Main API handler
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// This will handle all API routes and proxy to Supabase or handle business logic
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || ''
  
  // Handle different API endpoints
  if (path.startsWith('products')) {
    return handleProducts(request)
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || ''
  
  if (path.startsWith('auth')) {
    return handleAuth(request)
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

async function handleProducts(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, variants(*, size(*), color(*)), images(*)')
      .eq('isActive', true)
    
    if (error) throw error
    
    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleAuth(request: NextRequest) {
  try {
    const body = await request.json()
    // Handle authentication logic
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


