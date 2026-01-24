import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabase = getSupabaseServer()

    // Get safe transactions
    let safeQuery = supabase
      .from('safe_transactions')
      .select('*')
      .order('createdAt', { ascending: false })

    if (startDate) {
      safeQuery = safeQuery.gte('createdAt', startDate)
    }
    if (endDate) {
      const endDateWithTime = `${endDate}T23:59:59.999Z`
      safeQuery = safeQuery.lte('createdAt', endDateWithTime)
    }

    const { data: transactions, error } = await safeQuery

    if (error) {
      console.error('Error fetching safe status:', error)
      // If table doesn't exist, return empty data
      return NextResponse.json({
        data: {
          balance: '0.00',
          transactions: [],
          totalIncome: '0.00',
          totalExpenses: '0.00',
        },
        success: true,
      })
    }

    // Calculate balance
    const totalIncome = (transactions || [])
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0)

    const totalExpenses = (transactions || [])
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0)

    const balance = totalIncome - totalExpenses

    return NextResponse.json({
      data: {
        balance: balance.toFixed(2),
        transactions: transactions || [],
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
      },
      success: true,
    })
  } catch (error: any) {
    console.error('Error in safe route:', error)
    return NextResponse.json({
      data: {
        balance: '0.00',
        transactions: [],
        totalIncome: '0.00',
        totalExpenses: '0.00',
      },
      success: true,
    })
  }
}

