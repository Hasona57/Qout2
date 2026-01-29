import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()

    // Update invoice status to cancelled
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update({ status: 'cancelled' })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error cancelling invoice:', error)
      return NextResponse.json({ error: error.message, success: false }, { status: 500 })
    }

    // Restore stock if invoice was created
    if (invoice && invoice.locationId) {
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoiceId', params.id)

      for (const item of items || []) {
        const { data: stock } = await supabase
          .from('stock_items')
          .select('*')
          .eq('variantId', item.variantId)
          .eq('locationId', invoice.locationId)
          .single()

        if (stock) {
          const newQuantity = (stock.quantity || 0) + (item.quantity || 0)
          await supabase
            .from('stock_items')
            .update({ quantity: newQuantity })
            .eq('id', stock.id)
        }
      }
    }

    return NextResponse.json({ data: invoice, success: true })
  } catch (error: any) {
    console.error('Error cancelling invoice:', error)
    return NextResponse.json({ error: error.message || 'Failed to cancel invoice', success: false }, { status: 500 })
  }
}



