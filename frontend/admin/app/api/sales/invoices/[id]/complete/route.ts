import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getFirebaseServer()

    const existingInvoice = await db.get(`invoices/${params.id}`)
    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await db.update(`invoices/${params.id}`, {
      ...existingInvoice,
      status: 'paid',
      updatedAt: new Date().toISOString(),
    })

    const updatedInvoice = await db.get(`invoices/${params.id}`)
    return NextResponse.json({ data: updatedInvoice, success: true })
  } catch (error: any) {
    console.error('Error completing invoice:', error)
    return NextResponse.json({ error: error.message || 'Failed to complete invoice' }, { status: 500 })
  }
}







