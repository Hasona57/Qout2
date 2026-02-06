import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()

    // Get all employees (users with employeeCode)
    const allUsers = await db.getAll('users')
    const employees = allUsers.filter((u: any) => u.employeeCode != null && u.employeeCode !== '')

    // Calculate total monthly payroll
    const totalMonthlyPayroll = employees.reduce((sum, emp) => {
      return sum + parseFloat(emp.salary || 0)
    }, 0)

    // Calculate payroll data
    const payrollData = {
      employees: employees || [],
      totalEmployees: employees.length,
      totalMonthlyPayroll: totalMonthlyPayroll,
    }

    return NextResponse.json({ data: payrollData, success: true })
  } catch (error: any) {
    console.error('Error in payroll route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch payroll' }, { status: 500 })
  }
}

