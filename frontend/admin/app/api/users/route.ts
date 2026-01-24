import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        role:roleId(*)
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Remove passwords from response
    const usersWithoutPasswords = (users || []).map((user: any) => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })

    return NextResponse.json({ data: usersWithoutPasswords, success: true })
  } catch (error: any) {
    console.error('Error in users route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 })
  }
}

