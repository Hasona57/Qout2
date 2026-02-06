import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'
import { getUserRole, createUserProfile } from '@/lib/firebase-helpers'
import { createUserWithEmailPassword } from '@/lib/firebase-auth-server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json()
    const { db } = getFirebaseServer()

    // Check if user exists in database
    const users = await db.getAll('users')
    const existingUser = users.find((u: any) => u.email === email)

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Find customer role, create if it doesn't exist
    const roles = await db.getAll('roles')
    let customerRole = roles.find((r: any) => r.name === 'customer')

    if (!customerRole) {
      // Create customer role if it doesn't exist
      console.log('Customer role not found, creating it...')
      const roleId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'role'
      customerRole = {
        id: roleId,
        name: 'customer',
        description: 'Customer access',
        createdAt: new Date().toISOString(),
      }
      await db.set(`roles/${roleId}`, customerRole)
      console.log('Customer role created:', roleId)
    }

    // Create user in Firebase Auth
    let authResult
    try {
      authResult = await createUserWithEmailPassword(email, password)
    } catch (authError: any) {
      console.error('Firebase auth registration error:', authError)
      const errorMessage = authError.message || 'Registration failed'
      if (errorMessage.includes('EMAIL_EXISTS')) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    if (!authResult || !authResult.uid) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create user profile in Firebase Realtime Database
    try {
      const userData = {
        name,
        email,
        phone: phone || null,
        roleId: customerRole.id,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await createUserProfile(authResult.uid, userData)
    } catch (profileError: any) {
      console.error('Error creating user profile:', profileError)
      // If profile creation fails, we should still return success since user was created in Firebase Auth
      // But log the error for debugging
    }

    // Get role
    const role = await getUserRole(customerRole.id)

    // Use Firebase Auth token
    const token = authResult.idToken

    return NextResponse.json({
      data: {
        access_token: token,
        user: {
          id: authResult.uid,
          name,
          email,
          phone: phone || null,
          role: role || null,
        },
      },
      success: true,
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 })
  }
}

