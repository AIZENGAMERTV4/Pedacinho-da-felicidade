import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lairdyjzddplgdbdolab.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaXJkeWp6ZGRwbGdkYmRvbGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NDM4MjAsImV4cCI6MjEwMTAxOTgyMH0.xuNtw40m5PCTYOoNj6vL7D7IK8SsUkc8EiiontZeepM'

export const supabase = createClient(supabaseUrl, supabaseKey)