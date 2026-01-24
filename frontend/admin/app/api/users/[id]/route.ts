import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()

    // Get user first
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !user) {
      console.error('Error fetching user:', error)
      return NextResponse.json({ data: null, success: false, error: 'User not found' }, { status: 404 })
    }

    // Get role
    const { data: role } = user.roleId ? await supabase
      .from('roles')
      .select('*')
      .eq('id', user.roleId)
      .single() : { data: null }

    const { password, ...userWithoutPassword } = user
    return NextResponse.json({ 
      data: {
        ...userWithoutPassword,
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
    const supabase = getSupabaseServer()

    const { data: user, error } = await supabase
      .from('users')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { password, ...userWithoutPassword } = user
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
    const supabase = getSupabaseServer()

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 })
  }
}

