import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get user from token/cookie (simplified - you may need to implement proper auth)
    const supabase = getSupabaseServer()
    
    // For now, return empty array - implement proper auth to get userId
    // const userId = await getUserIdFromRequest(request)
    
    // const { data: addresses, error } = await supabase
    //   .from('addresses')
    //   .select('*')
    //   .eq('userId', userId)

    // if (error) {
    //   console.error('Error fetching addresses:', error)
    //   return NextResponse.json({ data: [], success: true })
    // }

    return NextResponse.json({ data: [], success: true })
  } catch (error: any) {
    console.error('Error in addresses route:', error)
    return NextResponse.json({ data: [], success: true })
  }
}



