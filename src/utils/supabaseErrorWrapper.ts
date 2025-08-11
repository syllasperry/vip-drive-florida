
import { useSupabaseErrorHandler } from '@/hooks/useSupabaseErrorHandler';

export const withErrorHandling = async <T>(
  supabaseQuery: Promise<{ data: T; error: any }>,
  context: string = '',
  fallbackData?: T
): Promise<{ data: T | null; error: any; handled: boolean }> => {
  try {
    const result = await supabaseQuery;
    
    if (result.error) {
      console.error(`[Supabase Query Error] ${context}:`, result.error);
      
      // Se temos dados de fallback, retornar eles em caso de erro
      if (fallbackData !== undefined) {
        console.log(`[Fallback] Usando dados de fallback para: ${context}`);
        return { data: fallbackData, error: result.error, handled: true };
      }
      
      return { data: null, error: result.error, handled: true };
    }
    
    return { data: result.data, error: null, handled: false };
  } catch (error) {
    console.error(`[Query Exception] ${context}:`, error);
    
    // Se temos dados de fallback, retornar eles em caso de exceção
    if (fallbackData !== undefined) {
      console.log(`[Fallback] Usando dados de fallback após exceção para: ${context}`);
      return { data: fallbackData, error, handled: true };
    }
    
    return { data: null, error, handled: true };
  }
};

// Hook para usar o wrapper com React Query
export const useSupabaseQuery = () => {
  const { handleSupabaseError } = useSupabaseErrorHandler();
  
  const queryWithErrorHandling = async <T>(
    supabaseQuery: Promise<{ data: T; error: any }>,
    context: string = '',
    fallbackData?: T
  ): Promise<T | null> => {
    const result = await withErrorHandling(supabaseQuery, context, fallbackData);
    
    if (result.error && result.handled) {
      handleSupabaseError(result.error, context);
    }
    
    return result.data;
  };
  
  return { queryWithErrorHandling };
};
