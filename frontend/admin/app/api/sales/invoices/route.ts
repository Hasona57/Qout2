import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        payments:payments(*),
        user:userId(*)
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: invoices || [], success: true })
  } catch (error: any) {
    console.error('Error in invoices route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 })
  }
}

