// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials
const supabaseUrl = 'https://qlpkhofninwegrzyqgmp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGtob2ZuaW53ZWdyenlxZ21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODAxNjksImV4cCI6MjA4NDc1NjE2OX0.2gNmrwRURVB0a6N2sKhNUmzd0QJfCUQgij7cwja8A9Q'

// Public client (for frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// For server-side operations (API Routes)
export const getSupabaseServer = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Helper to get authenticated client
export const getSupabaseAuth = (accessToken?: string) => {
  if (accessToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    })
  }
  return supabase
}
