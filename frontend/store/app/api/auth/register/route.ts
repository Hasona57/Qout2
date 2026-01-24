import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json()
    const supabase = getSupabaseServer()

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Find customer role
    const { data: customerRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'customer')
      .single()

    if (roleError || !customerRole) {
      return NextResponse.json({ error: 'Customer role not found. Please run database seeds first.' }, { status: 500 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        phone,
        roleId: customerRole.id,
        isActive: true,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Registration error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get role
    const { data: role } = await supabase
      .from('roles')
      .select('*')
      .eq('id', user.roleId)
      .single()

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
        },
      },
      success: true,
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 })
  }
}

