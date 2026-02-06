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

    // Find customer role
    const roles = await db.getAll('roles')
    const customerRole = roles.find((r: any) => r.name === 'customer')

    if (!customerRole) {
      return NextResponse.json({ error: 'Customer role not found. Please run database seeds first.' }, { status: 500 })
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

