// Supabase-Konfiguration
export const supabaseConfig = {
  // Diese Werte müssen in der .env.local Datei gesetzt werden
  url: process.env.REACT_APP_SUPABASE_URL || '',
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Standard-Tabellennamen
  tables: {
    articles: 'articles',
    recipes: 'recipes',
    suppliers: 'suppliers',
    einkauf: 'einkauf',
    inventur: 'inventur'
  },
  
  // Storage-Buckets
  storage: {
    images: 'images',
    documents: 'documents'
  },
  
  // Standard-Einstellungen
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
};

// Überprüfung der Konfiguration
export const validateSupabaseConfig = (): boolean => {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    console.warn('Supabase-Konfiguration fehlt. Bitte setzen Sie REACT_APP_SUPABASE_URL und REACT_APP_SUPABASE_ANON_KEY in der .env.local Datei.');
    return false;
  }
  
  if (!supabaseConfig.url.includes('supabase.co')) {
    console.warn('Ungültige Supabase-URL. Die URL sollte auf .supabase.co enden.');
    return false;
  }
  
  if (!supabaseConfig.anonKey.startsWith('eyJ')) {
    console.warn('Ungültiger Supabase-Anon-Key. Der Key sollte mit "eyJ" beginnen.');
    return false;
  }
  
  return true;
};

// Überprüfung der Admin-Konfiguration
export const validateAdminConfig = (): boolean => {
  if (!supabaseConfig.serviceRoleKey) {
    console.warn('Service Role Key fehlt. Admin-Funktionen sind nicht verfügbar.');
    return false;
  }
  
  if (!supabaseConfig.serviceRoleKey.startsWith('eyJ')) {
    console.warn('Ungültiger Service Role Key. Der Key sollte mit "eyJ" beginnen.');
    return false;
  }
  
  return true;
};
