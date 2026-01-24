import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'Address ID is required', success: false },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()

    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting address:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete address', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE address route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete address', success: false },
      { status: 500 }
    )
  }
}

