
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('Testing connection to user_notes...')
  const { data, error, status, statusText } = await supabase
    .from('user_notes')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
    console.log('Status:', status)
    console.log('StatusText:', statusText)
  } else {
    console.log('Success!', data)
  }
}

test()
