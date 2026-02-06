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

    console.log('=== STORE LOGIN DEBUG ===')
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
    let userProfile = await db.get(`users/${authResult.uid}`)

    // If user doesn't exist in database but exists in Firebase Auth, create a basic profile
    if (!userProfile) {
      console.log('User not found in database, creating basic profile...')
      // Find customer role
      const roles = await db.getAll('roles')
      let customerRole = roles.find((r: any) => r.name === 'customer')
      
      if (!customerRole) {
        // Create customer role if it doesn't exist
        const roleId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'role'
        customerRole = {
          id: roleId,
          name: 'customer',
          description: 'Customer access',
          createdAt: new Date().toISOString(),
        }
        await db.set(`roles/${roleId}`, customerRole)
      }

      // Create basic user profile
      userProfile = {
        id: authResult.uid,
        email: authResult.email,
        name: authResult.email.split('@')[0], // Use email prefix as name
        roleId: customerRole.id,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await db.set(`users/${authResult.uid}`, userProfile)
      console.log('Created basic user profile for:', authResult.uid)
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
          ...userWithoutPassword,
          id: userProfile.id || authResult.uid,
          role: role || null,
        },
      },
      success: true,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 })
  }
}





