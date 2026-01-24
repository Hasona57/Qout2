import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    // Get users first
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ data: [], success: true })
    }

    // Get roles
    const roleIds = [...new Set((users || []).map((u: any) => u.roleId).filter(Boolean))]
    const { data: roles } = roleIds.length > 0 ? await supabase
      .from('roles')
      .select('*')
      .in('id', roleIds) : { data: [] }

    const roleMap = new Map((roles || []).map((r: any) => [r.id, r]))

    // Remove passwords and add roles
    const usersWithoutPasswords = (users || []).map((user: any) => {
      const { password, ...userWithoutPassword } = user
      return {
        ...userWithoutPassword,
        role: roleMap.get(user.roleId) || null,
      }
    })

    return NextResponse.json({ data: usersWithoutPasswords, success: true })
  } catch (error: any) {
    console.error('Error in users route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 })
  }
}

