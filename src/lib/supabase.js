import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lairdyjzddplgdbdolab.supabase.co'
const supabaseKey = 'sb_publishable_oFxznNYUpC8F91YvZp_EIA_EBxZRsQw'

export const supabase = createClient(supabaseUrl, supabaseKey)