import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getFirebaseServer()

    // Get invoice
    const invoice = await db.get(`invoices/${params.id}`)

    if (!invoice) {
      return NextResponse.json({ data: null, success: false, error: 'Invoice not found' }, { status: 404 })
    }

    // Get related data
    const [allItems, allPayments, allVariants] = await Promise.all([
      db.getAll('invoice_items'),
      db.getAll('payments'),
      db.getAll('product_variants'),
    ])

    const items = allItems.filter((item: any) => item.invoiceId === params.id)
    const payments = allPayments.filter((pay: any) => pay.invoiceId === params.id)

    const variantIds = [...new Set(items.map((item: any) => item.variantId).filter(Boolean))]
    const variants = allVariants.filter((v: any) => variantIds.includes(v.id))
    const variantMap = new Map(variants.map((v: any) => [v.id, v]))

    // Combine data
    const invoiceWithDetails = {
      ...invoice,
      id: params.id,
      items: items.map((item: any) => ({
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







