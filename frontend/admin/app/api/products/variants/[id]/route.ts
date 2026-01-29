import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()

    // Delete variant
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting variant:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete variant', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE variant route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete variant', success: false },
      { status: 500 }
    )
  }
}


