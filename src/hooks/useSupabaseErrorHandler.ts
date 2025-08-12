
import { useCallback } from 'react';
import { toast } from 'sonner';

export const useSupabaseErrorHandler = () => {
  const handleSupabaseError = useCallback((error: any, context: string = '') => {
    console.error(`[Supabase Error] ${context}:`, error);
    
    // Verificar se é erro de RLS
    if (error?.message?.includes('RLS') || error?.code === '42501') {
      console.warn('[RLS Error] Erro de permissão detectado:', error.message);
      toast.error('Você não tem permissão para acessar estes dados');
      return 'RLS_ERROR';
    }
    
    // Verificar se é erro de rede
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      console.warn('[Network Error] Erro de rede detectado:', error.message);
      toast.error('Erro de conexão. Verifique sua internet');
      return 'NETWORK_ERROR';
    }
    
    // Verificar se é erro de autenticação
    if (error?.message?.includes('auth') || error?.code === '401') {
      console.warn('[Auth Error] Erro de autenticação detectado:', error.message);
      toast.error('Sessão expirada. Faça login novamente');
      return 'AUTH_ERROR';
    }
    
    // Erro genérico do Supabase
    if (error?.message?.includes('supabase')) {
      console.warn('[Supabase Error] Erro genérico do Supabase:', error.message);
      toast.error('Erro no servidor. Tente novamente');
      return 'SUPABASE_ERROR';
    }
    
    // Erro desconhecido
    console.error('[Unknown Error]:', error);
    toast.error('Erro inesperado. Tente novamente');
    return 'UNKNOWN_ERROR';
  }, []);

  return { handleSupabaseError };
};
