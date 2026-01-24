import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const supabase = getSupabaseServer()

    // Find user first
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('isActive', true)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Get role
    const { data: role } = user.roleId ? await supabase
      .from('roles')
      .select('*')
      .eq('id', user.roleId)
      .single() : { data: null }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
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
