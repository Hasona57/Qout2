import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'
import { getUserRole } from '@/lib/firebase-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getFirebaseServer()

    // Get user
    const user = await db.get(`users/${params.id}`)

    if (!user) {
      return NextResponse.json({ data: null, success: false, error: 'User not found' }, { status: 404 })
    }

    // Get role
    const role = user.roleId ? await getUserRole(user.roleId) : null

    const { password, ...userWithoutPassword } = user
    return NextResponse.json({ 
      data: {
        ...userWithoutPassword,
        id: params.id,
        role: role || null,
      }, 
      success: true 
    })
  } catch (error: any) {
    console.error('Error in user route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { db } = getFirebaseServer()

    const existingUser = await db.get(`users/${params.id}`)
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await db.update(`users/${params.id}`, {
      ...existingUser,
      ...body,
      updatedAt: new Date().toISOString(),
    })

    const updatedUser = await db.get(`users/${params.id}`)
    const { password, ...userWithoutPassword } = updatedUser
    return NextResponse.json({ data: userWithoutPassword, success: true })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getFirebaseServer()

    await db.remove(`users/${params.id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 })
  }
}

