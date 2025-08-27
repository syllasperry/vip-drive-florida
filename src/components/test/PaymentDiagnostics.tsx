
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'checking';
  message: string;
  details?: any;
}

export const PaymentDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // 1. Verificar variáveis de ambiente
    console.log('🔍 Checking environment variables...');
    
    // Stripe Publishable Key
    const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    results.push({
      name: 'VITE_STRIPE_PUBLISHABLE_KEY',
      status: stripePublishableKey ? 'success' : 'error',
      message: stripePublishableKey ? 
        `Present: ${stripePublishableKey.substring(0, 20)}...` : 
        'Missing Stripe Publishable Key',
      details: { key: stripePublishableKey }
    });

    // Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    results.push({
      name: 'VITE_SUPABASE_URL',
      status: supabaseUrl ? 'success' : 'error',
      message: supabaseUrl ? 
        `Present: ${supabaseUrl}` : 
        'Missing Supabase URL',
      details: { url: supabaseUrl }
    });

    // Supabase Anon Key
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    results.push({
      name: 'VITE_SUPABASE_PUBLISHABLE_KEY',
      status: supabaseKey ? 'success' : 'error',
      message: supabaseKey ? 
        `Present: ${supabaseKey.substring(0, 20)}...` : 
        'Missing Supabase Anon Key',
      details: { key: supabaseKey }
    });

    // 2. Verificar conectividade com Supabase
    console.log('🔍 Testing Supabase connection...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      results.push({
        name: 'Supabase Connection',
        status: 'success',
        message: user ? `Connected as: ${user.email}` : 'Connected (no user)',
        details: { user }
      });
    } catch (error) {
      results.push({
        name: 'Supabase Connection',
        status: 'error',
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }

    // 3. Verificar se as Edge Functions estão acessíveis
    console.log('🔍 Testing Edge Functions...');
    try {
      // Testar stripe-start-checkout
      const { data, error } = await supabase.functions.invoke('stripe-start-checkout', {
        body: { test: true }
      });
      
      results.push({
        name: 'stripe-start-checkout Function',
        status: error && error.message?.includes('booking_id is required') ? 'success' : 'error',
        message: error && error.message?.includes('booking_id is required') ? 
          'Function accessible (validation working)' : 
          `Function issue: ${error?.message || 'Unknown error'}`,
        details: { data, error }
      });
    } catch (error) {
      results.push({
        name: 'stripe-start-checkout Function',
        status: 'error',
        message: `Function not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }

    // 4. Verificar tabela de bookings
    console.log('🔍 Testing bookings table access...');
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, payment_status, paid_at')
        .limit(1);

      results.push({
        name: 'Bookings Table Access',
        status: error ? 'error' : 'success',
        message: error ? 
          `Table access failed: ${error.message}` : 
          `Table accessible (${data?.length || 0} records found)`,
        details: { data, error }
      });
    } catch (error) {
      results.push({
        name: 'Bookings Table Access',
        status: 'error',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }

    // 5. Verificar webhook events na tabela
    console.log('🔍 Checking webhook events...');
    try {
      const { data, error } = await supabase
        .from('payment_webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      results.push({
        name: 'Webhook Events',
        status: error ? 'error' : (data && data.length > 0 ? 'success' : 'warning'),
        message: error ? 
          `Webhook table error: ${error.message}` : 
          data && data.length > 0 ? 
            `Found ${data.length} recent webhook events` : 
            'No webhook events found (may be normal for new setup)',
        details: { data, error }
      });
    } catch (error) {
      results.push({
        name: 'Webhook Events',
        status: 'error',
        message: `Webhook check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }

    // 6. Verificar recentemente processados bookings pagos
    console.log('🔍 Checking paid bookings...');
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_code, status, payment_status, paid_at, paid_amount_cents, payment_provider')
        .or('status.eq.paid,payment_status.eq.paid')
        .order('created_at', { ascending: false })
        .limit(10);

      results.push({
        name: 'Recent Paid Bookings',
        status: error ? 'error' : 'success',
        message: error ? 
          `Paid bookings check failed: ${error.message}` : 
          `Found ${data?.length || 0} paid bookings`,
        details: { data, error }
      });
    } catch (error) {
      results.push({
        name: 'Recent Paid Bookings',
        status: 'error',
        message: `Paid bookings error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }

    setDiagnostics(results);
    setIsRunning(false);

    // Mostrar resumo
    const errors = results.filter(r => r.status === 'error').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    
    if (errors > 0) {
      toast({
        title: "Diagnostics Complete",
        description: `Found ${errors} errors and ${warnings} warnings. Check details below.`,
        variant: "destructive",
      });
    } else if (warnings > 0) {
      toast({
        title: "Diagnostics Complete",
        description: `No errors found, but ${warnings} warnings detected.`,
      });
    } else {
      toast({
        title: "Diagnostics Complete",
        description: "All systems appear to be working correctly!",
      });
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'checking':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">WARNING</Badge>;
      case 'checking':
        return <Badge variant="outline">CHECKING</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔧 Payment System Diagnostics
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostics}
              disabled={isRunning}
              size="sm"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-run Diagnostics
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {diagnostics.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p>Running initial diagnostics...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {diagnostics.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{result.name}</h4>
                          {getStatusBadge(result.status)}
                        </div>
                        <p className="text-sm text-gray-600">{result.message}</p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                              View details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">🔍 Summary & Next Steps:</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Errors found:</strong> {diagnostics.filter(r => r.status === 'error').length}</p>
                  <p><strong>Warnings:</strong> {diagnostics.filter(r => r.status === 'warning').length}</p>
                  <p><strong>Successful checks:</strong> {diagnostics.filter(r => r.status === 'success').length}</p>
                </div>
                
                {diagnostics.filter(r => r.status === 'error').length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 font-medium">❌ Critical Issues Found:</p>
                    <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                      {diagnostics.filter(r => r.status === 'error').map((result, i) => (
                        <li key={i}>{result.name}: {result.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
