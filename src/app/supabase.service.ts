// src/app/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { Logger } from './utils/logger';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          // Habilitar auto-refresh de tokens
          autoRefreshToken: true,
          
          // Persistir sesión en localStorage
          persistSession: true,
          
          // Detectar sesión en URL (útil para magic links y OAuth)
          detectSessionInUrl: true,
          
          // Configuración de almacenamiento
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          
          // flowType para usar PKCE (más seguro)
          flowType: 'pkce'
        },
        
        // Configuración global
        global: {
          headers: {
            'X-Client-Info': 'supabase-angular-client'
          }
        }
      }
    );

    // Log para debugging (puedes eliminarlo en producción)
    this.supabase.auth.onAuthStateChange((event, session) => {
      Logger.log('🔐 Auth State Change:', event);
      Logger.log('👤 Session User:', session?.user?.id);
      Logger.log('🎫 Access Token:', session?.access_token ? 'Present' : 'Missing');
      
      if (event === 'SIGNED_OUT') {
        Logger.log('🚪 Usuario cerró sesión');
      }
      
      if (event === 'TOKEN_REFRESHED') {
        Logger.log('♻️ Token renovado exitosamente');
      }
    });
  }
}
