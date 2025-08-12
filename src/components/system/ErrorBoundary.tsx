
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log do erro para debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleTryAgain = () => {
    console.log('[ErrorBoundary] Tentando novamente - recarregando página');
    window.location.reload();
  };

  handleSignOut = async () => {
    try {
      console.log('[ErrorBoundary] Fazendo logout e limpando storage');
      
      // Limpar todo o storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Tentar logout global
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        console.error('[ErrorBoundary] Erro no logout:', signOutError);
      }
      
      // Redirecionar para login
      window.location.href = '/passenger/login';
    } catch (error) {
      console.error('[ErrorBoundary] Erro no handleSignOut:', error);
      // Forçar redirecionamento mesmo com erro
      window.location.href = '/passenger/login';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Algo deu errado</CardTitle>
              <CardDescription>
                {this.state.error?.message || 'Ocorreu um erro inesperado no aplicativo'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mostrar detalhes do erro em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p className="font-semibold">Detalhes do erro:</p>
                  <p className="text-muted-foreground mt-1">{this.state.error.stack}</p>
                </div>
              )}
              
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={this.handleTryAgain}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
                
                <Button 
                  onClick={this.handleSignOut}
                  variant="outline"
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
