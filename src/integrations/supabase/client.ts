
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://jqdodxjqhtfbhxcuwpcf.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZG9keGpxaHRmYmh4Y3V3cGNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDkzNzksImV4cCI6MjA2NTY4NTM3OX0.0ih4QV8nSqcN13-G0CxBzeHLKTEkFfKnEjKq4DvYSO4"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})
