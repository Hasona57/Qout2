import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()

    // Get invoice first
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !invoice) {
      console.error('Error fetching invoice:', error)
      return NextResponse.json({ data: null, success: false, error: 'Invoice not found' }, { status: 404 })
    }

    // Get related data
    const invoiceId = invoice.id

    // Get invoice items
    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoiceId', invoiceId)

    // Get payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('invoiceId', invoiceId)

    // Get variant details for items
    const variantIds = [...new Set((items || []).map((item: any) => item.variantId).filter(Boolean))]
    const { data: variants } = variantIds.length > 0 ? await supabase
      .from('product_variants')
      .select('*')
      .in('id', variantIds) : { data: [] }

    const variantMap = new Map((variants || []).map((v: any) => [v.id, v]))

    // Combine data
    const invoiceWithDetails = {
      ...invoice,
      items: (items || []).map((item: any) => ({
        ...item,
        variant: variantMap.get(item.variantId) || null,
      })),
      payments: payments || [],
    }

    return NextResponse.json({ data: invoiceWithDetails, success: true })
  } catch (error: any) {
    console.error('Error in invoice route:', error)
    return NextResponse.json({ data: null, success: false, error: error.message })
  }
}


