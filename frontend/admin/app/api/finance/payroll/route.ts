import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    // Get all employees (users with employeeCode)
    const { data: employees, error } = await supabase
      .from('users')
      .select('*')
      .not('employeeCode', 'is', null)

    if (error) {
      console.error('Error fetching payroll:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate payroll data
    const payrollData = {
      employees: employees || [],
      totalEmployees: employees?.length || 0,
      totalMonthlyPayroll: 0, // This would need salary field in users table
    }

    return NextResponse.json({ data: payrollData, success: true })
  } catch (error: any) {
    console.error('Error in payroll route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch payroll' }, { status: 500 })
  }
}

