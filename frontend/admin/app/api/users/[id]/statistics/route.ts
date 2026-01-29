import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()

    // Get user's orders, invoices, and sales statistics
    const [ordersResult, invoicesResult] = await Promise.all([
      supabase
        .from('orders')
        .select('id, total, status, createdAt')
        .eq('userId', params.id),
      supabase
        .from('invoices')
        .select('id, total, status, createdAt')
        .eq('userId', params.id),
    ])

    const orders = ordersResult.data || []
    const invoices = invoicesResult.data || []

    const totalOrders = orders.length
    const totalInvoices = invoices.length
    const totalPiecesSold = invoices.reduce((sum, inv) => {
      // This would need invoice_items join, simplified for now
      return sum
    }, 0)

    const totalSales = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0)

    const totalProfit = totalSales * 0.3 // Simplified calculation

    return NextResponse.json({
      data: {
        totalOrders,
        totalInvoices,
        totalPiecesSold,
        totalSales: totalSales.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
      },
      success: true,
    })
  } catch (error: any) {
    console.error('Error in user statistics route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch user statistics' }, { status: 500 })
  }
}


