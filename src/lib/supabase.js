import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validação básica para evitar crash imediato
const isValidConfig = supabaseUrl && 
                      supabaseUrl !== 'https://your-project-id.supabase.co' && 
                      supabaseAnonKey && 
                      supabaseAnonKey !== 'your-placeholder-anon-key'

if (!isValidConfig) {
  console.warn("⚠️ [Supabase] Configuração incompleta ou usando placeholders. Verifique seu arquivo .env");
}

// Exportamos o cliente. Se não for válido, chamadas subsequentes podem falhar, 
// mas não trava o carregamento inicial do script se passarmos strings vazias em vez de undefined.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)
