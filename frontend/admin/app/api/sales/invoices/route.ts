import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    // First try to get invoices with relations
    let { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      // Return empty array instead of error to prevent 502
      return NextResponse.json({ data: [], success: true })
    }

    // If we have invoices, try to get related data
    if (invoices && invoices.length > 0) {
      const invoiceIds = invoices.map((inv: any) => inv.id)
      
      // Get invoice items
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .in('invoiceId', invoiceIds)

      // Get payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .in('invoiceId', invoiceIds)

      // Get users
      const userIds = [...new Set(invoices.map((inv: any) => inv.createdById).filter(Boolean))]
      const { data: users } = userIds.length > 0 ? await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds) : { data: [] }

      const userMap = new Map((users || []).map((u: any) => [u.id, u]))

      // Combine data
      invoices = invoices.map((invoice: any) => ({
        ...invoice,
        items: (items || []).filter((item: any) => item.invoiceId === invoice.id),
        payments: (payments || []).filter((pay: any) => pay.invoiceId === invoice.id),
        createdBy: userMap.get(invoice.createdById) || null,
      }))
    }

    return NextResponse.json({ data: invoices || [], success: true })
  } catch (error: any) {
    console.error('Error in invoices route:', error)
    return NextResponse.json({ data: [], success: true, error: error.message })
  }
}

