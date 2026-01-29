import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    
    const supabase = getSupabaseServer()

    console.log('=== LOGIN DEBUG ===')
    console.log('Email:', email)

    // Find user first
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('isActive', true)
      .single()

    if (error) {
      console.error('Error finding user:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
    }

    if (error || !user) {
      console.log('User not found or inactive')
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    console.log('User found:', user.id, user.email)
    console.log('User password hash length:', user.password?.length)

    // Get role
    const { data: role } = user.roleId ? await supabase
      .from('roles')
      .select('*')
      .eq('id', user.roleId)
      .single() : { data: null }

    // Verify password
    console.log('Comparing password...')
    const isValid = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isValid)
    
    if (!isValid) {
      console.log('Invalid password')
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Update last login
    await supabase
      .from('users')
      .update({ lastLoginAt: new Date().toISOString() })
      .eq('id', user.id)

    // Generate JWT token
    const token = jwt.sign(
      { 
        sub: user.id, 
        email: user.email, 
        role: role?.name || 'customer' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      data: {
        access_token: token,
        user: {
          id: userWithoutPassword.id,
          name: userWithoutPassword.name,
          email: userWithoutPassword.email,
          phone: userWithoutPassword.phone,
          role: role || null,
          commissionRate: userWithoutPassword.commissionRate,
          employeeCode: userWithoutPassword.employeeCode,
        },
      },
      success: true,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 })
  }
}
