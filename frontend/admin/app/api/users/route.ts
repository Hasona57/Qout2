import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()

    // Get all users
    let users = await db.getAll('users')
    
    // Sort by createdAt descending
    users.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })

    // Get roles
    const roleIds = [...new Set(users.map((u: any) => u.roleId).filter(Boolean))]
    const allRoles = await db.getAll('roles')
    const roles = allRoles.filter((r: any) => roleIds.includes(r.id))

    const roleMap = new Map(roles.map((r: any) => [r.id, r]))

    // Remove passwords and add roles
    const usersWithoutPasswords = users.map((user: any) => {
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

