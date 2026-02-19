/**
 * ErrorBoundary — Generic error boundary component
 * 
 * Catches JavaScript errors in child components and displays fallback UI
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
  moduleName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps & { navigate: (path: string) => void },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { navigate: (path: string) => void }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Chunk-Ladefehler erkennen und automatisch neu laden
    const isChunkError =
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk');

    if (isChunkError) {
      const alreadyReloaded = sessionStorage.getItem('chunk-reload-attempted');
      if (!alreadyReloaded) {
        sessionStorage.setItem('chunk-reload-attempted', 'true');
        window.location.reload();
        return;
      }
      // Wenn bereits neu geladen wurde, normalen Fehler anzeigen
      sessionStorage.removeItem('chunk-reload-attempted');
    }

    this.setState({ errorInfo });
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleNavigateHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.navigate('/portal');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Card className="max-w-lg w-full border-destructive/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Etwas ist schiefgelaufen</CardTitle>
              <CardDescription>
                {this.props.moduleName 
                  ? `Im Modul "${this.props.moduleName}" ist ein Fehler aufgetreten.`
                  : 'Ein unerwarteter Fehler ist aufgetreten.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={this.handleReset}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Erneut versuchen
                </Button>
                <Button onClick={this.handleNavigateHome}>
                  <Home className="h-4 w-4 mr-2" />
                  Zum Portal
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Stack Trace (Development)
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-48">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    // Erfolgreicher Render: Chunk-Reload-Flag zuruecksetzen
    sessionStorage.removeItem('chunk-reload-attempted');
    return this.props.children;
  }
}

// Wrapper to use hooks with class component
export function ErrorBoundary(props: ErrorBoundaryProps) {
  const navigate = useNavigate();
  return <ErrorBoundaryClass {...props} navigate={navigate} />;
}

export default ErrorBoundary;
