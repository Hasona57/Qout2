import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'
import { getUserRole, updateUserLastLogin } from '@/lib/firebase-helpers'
import { signInWithEmailPassword } from '@/lib/firebase-auth-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    console.log('=== POS LOGIN DEBUG ===')
    console.log('Email:', email)

    // Authenticate with Firebase Auth using REST API
    let authResult
    try {
      authResult = await signInWithEmailPassword(email, password)
    } catch (authError: any) {
      console.error('Firebase auth error:', authError)
      const errorMessage = authError.message || 'Authentication failed'
      if (errorMessage.includes('INVALID_PASSWORD') || errorMessage.includes('EMAIL_NOT_FOUND') || errorMessage.includes('INVALID_LOGIN_CREDENTIALS')) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }
      return NextResponse.json({ error: errorMessage }, { status: 401 })
    }

    if (!authResult || !authResult.uid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Get user profile from Firebase Realtime Database
    const { db } = getFirebaseServer()
    const userProfile = await db.get(`users/${authResult.uid}`)

    if (!userProfile) {
      console.log('User not found or inactive')
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (userProfile.isActive === false) {
      console.log('User is inactive')
      return NextResponse.json({ error: 'Account is inactive' }, { status: 401 })
    }

    console.log('User found:', userProfile.id, userProfile.email)

    // Get role
    const role = userProfile.roleId ? await getUserRole(userProfile.roleId) : null

    // Update last login
    await updateUserLastLogin(authResult.uid)

    // Use Firebase Auth token
    const token = authResult.idToken

    // Remove password from response
    const { password: _, ...userWithoutPassword } = userProfile

    return NextResponse.json({
      data: {
        access_token: token,
        user: {
          id: userProfile.id || authResult.uid,
          name: userProfile.name,
          email: userProfile.email || authResult.email,
          phone: userProfile.phone,
          role: role || null,
          commissionRate: userProfile.commissionRate || 0,
          employeeCode: userProfile.employeeCode,
        },
      },
      success: true,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 })
  }
}



