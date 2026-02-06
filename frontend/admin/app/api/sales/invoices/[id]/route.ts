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
    const [allItems, allPayments, allUsers] = await Promise.all([
      db.getAll('invoice_items'),
      db.getAll('payments'),
      db.getAll('users'),
    ])

    const items = allItems.filter((item: any) => item.invoiceId === params.id)
    const payments = allPayments.filter((pay: any) => pay.invoiceId === params.id)
    const user = invoice.createdById ? allUsers.find((u: any) => u.id === invoice.createdById) : null

    // Combine data
    const invoiceWithDetails = {
      ...invoice,
      id: params.id,
      items: items || [],
      payments: payments || [],
      createdBy: user ? { id: user.id, name: user.name, email: user.email } : null,
    }

    return NextResponse.json({ data: invoiceWithDetails, success: true })
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
    const { db } = getFirebaseServer()

    const existingInvoice = await db.get(`invoices/${params.id}`)
    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await db.update(`invoices/${params.id}`, {
      ...existingInvoice,
      ...body,
      updatedAt: new Date().toISOString(),
    })

    const updatedInvoice = await db.get(`invoices/${params.id}`)
    return NextResponse.json({ data: updatedInvoice, success: true })
  } catch (error: any) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 })
  }
}

