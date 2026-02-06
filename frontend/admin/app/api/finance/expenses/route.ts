import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()

    let expenses = await db.getAll('expenses')
    
    // Sort by date descending
    expenses.sort((a: any, b: any) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime()
      const dateB = new Date(b.date || b.createdAt || 0).getTime()
      return dateB - dateA
    })

    return NextResponse.json({ data: expenses || [], success: true })
  } catch (error: any) {
    console.error('Error in expenses route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { db } = getFirebaseServer()

    const expenseId = Date.now().toString(36) + Math.random().toString(36).substr(2)
    const expenseData = {
      ...body,
      id: expenseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.set(`expenses/${expenseId}`, expenseData)

    return NextResponse.json({ data: expenseData, success: true })
  } catch (error: any) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: error.message || 'Failed to create expense' }, { status: 500 })
  }
}

