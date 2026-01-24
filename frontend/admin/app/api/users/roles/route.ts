import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching roles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: roles || [], success: true })
  } catch (error: any) {
    console.error('Error in roles route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch roles' }, { status: 500 })
  }
}

