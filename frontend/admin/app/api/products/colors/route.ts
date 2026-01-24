import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .eq('isActive', true)
      .order('nameAr', { ascending: true })

    if (error) {
      console.error('Error fetching colors:', error)
      return NextResponse.json({ data: [], success: true })
    }

    return NextResponse.json({ data: data || [], success: true })
  } catch (error: any) {
    console.error('Error in colors route:', error)
    return NextResponse.json({ data: [], success: true })
  }
}

