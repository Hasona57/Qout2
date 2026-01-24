import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    const { data: locations, error } = await supabase
      .from('stock_locations')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching locations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: locations || [], success: true })
  } catch (error: any) {
    console.error('Error in locations route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch locations' }, { status: 500 })
  }
}

