import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getFirebaseServer()

    // Get user's orders and invoices
    const [allOrders, allInvoices, allInvoiceItems] = await Promise.all([
      db.getAll('orders'),
      db.getAll('invoices'),
      db.getAll('invoice_items'),
    ])

    const orders = allOrders.filter((o: any) => o.userId === params.id)
    const invoices = allInvoices.filter((inv: any) => inv.userId === params.id)

    const totalOrders = orders.length
    const totalInvoices = invoices.length
    
    // Calculate total pieces sold from invoice items
    const invoiceIds = invoices.map((inv: any) => inv.id)
    const relevantItems = allInvoiceItems.filter((item: any) => invoiceIds.includes(item.invoiceId))
    const totalPiecesSold = relevantItems.reduce((sum, item) => sum + (item.quantity || 0), 0)

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







