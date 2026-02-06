import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromMethod, toMethod, amount, notes } = body

    if (!fromMethod || !toMethod || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'fromMethod, toMethod, and amount are required', success: false },
        { status: 400 }
      )
    }

    const { db } = getFirebaseServer()

    // Get payment methods (hardcoded for now, or get from database)
    const paymentMethods = [
      { code: 'cash', nameEn: 'Cash' },
      { code: 'cash_pos', nameEn: 'Cash POS' },
      { code: 'cod', nameEn: 'Cash on Delivery' },
      { code: 'vodafone_cash', nameEn: 'Vodafone Cash' },
      { code: 'instapay', nameEn: 'Instapay' },
      { code: 'fawry', nameEn: 'Fawry' },
    ]

    const fromMethodData = paymentMethods.find((m: any) => m.code === fromMethod || m.id === fromMethod)
    const toMethodData = paymentMethods.find((m: any) => m.code === toMethod || m.id === toMethod)

    if (!fromMethodData || !toMethodData) {
      return NextResponse.json(
        { error: 'Invalid payment method', success: false },
        { status: 400 }
      )
    }

    const transferAmount = parseFloat(amount)
    const transferDate = new Date().toISOString()

    // Create transfer record in safe_transactions
    try {
      const transferId = Date.now().toString(36) + Math.random().toString(36).substr(2)
      await db.set(`safe_transactions/${transferId}`, {
        id: transferId,
        type: 'transfer',
        amount: transferAmount.toString(),
        fromMethod: fromMethodData.code,
        toMethod: toMethodData.code,
        notes: notes || `Transfer from ${fromMethodData.nameEn} to ${toMethodData.nameEn}`,
        createdAt: transferDate,
      })
    } catch (e) {
      console.log('Could not create transfer record:', e)
    }

    // Record as expense from source method
    const expenseId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'exp'
    await db.set(`expenses/${expenseId}`, {
      id: expenseId,
      title: `Transfer to ${toMethodData.nameEn}`,
      amount: transferAmount,
      type: 'transfer',
      description: notes || `Money transferred from ${fromMethodData.nameEn} to ${toMethodData.nameEn}`,
      date: transferDate,
      createdAt: transferDate,
      isRecurring: false,
      paymentMethod: fromMethodData.code,
    })

    // Record as income to destination method (or create a separate income table)
    // For now, we'll just log it in expenses with negative amount or create a separate entry
    // In a real system, you'd have a proper accounting system

    return NextResponse.json({
      data: {
        fromMethod: fromMethodData.nameEn,
        toMethod: toMethodData.nameEn,
        amount: transferAmount,
        notes,
      },
      success: true,
      message: 'Transfer completed successfully',
    })
  } catch (error: any) {
    console.error('Error in finance transfer route:', error)
    return NextResponse.json({ error: error.message || 'Failed to transfer money', success: false }, { status: 500 })
  }
}







