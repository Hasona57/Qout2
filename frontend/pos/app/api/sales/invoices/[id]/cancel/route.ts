import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getFirebaseServer()

    // Get invoice
    const invoice = await db.get(`invoices/${params.id}`)

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found', success: false }, { status: 404 })
    }

    // Update invoice status to cancelled
    await db.update(`invoices/${params.id}`, {
      ...invoice,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    })

    // Restore stock if invoice was created
    if (invoice.locationId) {
      const allItems = await db.getAll('invoice_items')
      const items = allItems.filter((item: any) => item.invoiceId === params.id)
      const allStock = await db.getAll('stock_items')

      for (const item of items) {
        const stock = allStock.find((s: any) => 
          s.variantId === item.variantId && s.locationId === invoice.locationId
        )

        if (stock) {
          const newQuantity = (stock.quantity || 0) + (item.quantity || 0)
          await db.update(`stock_items/${stock.id}`, {
            ...stock,
            quantity: newQuantity,
            updatedAt: new Date().toISOString(),
          })
        }
      }
    }

    const updatedInvoice = await db.get(`invoices/${params.id}`)
    return NextResponse.json({ data: updatedInvoice, success: true })
  } catch (error: any) {
    console.error('Error cancelling invoice:', error)
    return NextResponse.json({ error: error.message || 'Failed to cancel invoice', success: false }, { status: 500 })
  }
}







