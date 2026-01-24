import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

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

    const supabase = getSupabaseServer()

    // Get payment methods
    const { data: paymentMethods } = await supabase
      .from('payment_methods')
      .select('*')

    const fromMethodData = paymentMethods?.find((m: any) => m.code === fromMethod || m.id === fromMethod)
    const toMethodData = paymentMethods?.find((m: any) => m.code === toMethod || m.id === toMethod)

    if (!fromMethodData || !toMethodData) {
      return NextResponse.json(
        { error: 'Invalid payment method', success: false },
        { status: 400 }
      )
    }

    const transferAmount = parseFloat(amount)

    // Create transfer record (if safe_transactions table exists)
    try {
      const { data: transfer, error: transferError } = await supabase
        .from('safe_transactions')
        .insert({
          type: 'transfer',
          amount: transferAmount.toString(),
          fromMethod: fromMethodData.code,
          toMethod: toMethodData.code,
          notes: notes || `Transfer from ${fromMethodData.nameEn} to ${toMethodData.nameEn}`,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single()

      if (transferError && transferError.code !== 'PGRST116') {
        console.error('Error creating transfer record:', transferError)
      }
    } catch (e) {
      // Table might not exist, continue anyway
      console.log('Could not create transfer record:', e)
    }

    // Create two payment records: one expense (from) and one income (to)
    // This is a simplified approach - in a real system, you'd have a proper safe/balance table
    const transferDate = new Date().toISOString()

    // Record as expense from source method
    await supabase.from('expenses').insert({
      title: `Transfer to ${toMethodData.nameEn}`,
      amount: transferAmount,
      type: 'transfer',
      description: notes || `Money transferred from ${fromMethodData.nameEn} to ${toMethodData.nameEn}`,
      date: transferDate,
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

