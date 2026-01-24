import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: expenses || [], success: true })
  } catch (error: any) {
    console.error('Error in expenses route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getSupabaseServer()

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error creating expense:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: expense, success: true })
  } catch (error: any) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: error.message || 'Failed to create expense' }, { status: 500 })
  }
}

