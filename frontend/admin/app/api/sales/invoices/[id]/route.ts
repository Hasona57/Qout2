import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        payments:payments(*),
        user:userId(*)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: invoice, success: true })
  } catch (error: any) {
    console.error('Error in invoice route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const supabase = getSupabaseServer()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: invoice, success: true })
  } catch (error: any) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 })
  }
}

