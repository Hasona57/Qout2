import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error completing invoice:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: invoice, success: true })
  } catch (error: any) {
    console.error('Error completing invoice:', error)
    return NextResponse.json({ error: error.message || 'Failed to complete invoice' }, { status: 500 })
  }
}

