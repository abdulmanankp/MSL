import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class PdfmeDesignerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ PdfmeDesigner Error Boundary caught an error:', error);
    console.error('Error details:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-[650px] p-8">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-xl">PDF Designer Error</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  The PDF template designer encountered an error and couldn't initialize properly.
                </p>
                
                <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-auto max-h-32">
                  {this.state.error?.message || 'Unknown error occurred'}
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-sm">Common causes:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Invalid or corrupted PDF file uploaded</li>
                  <li>PDF file structure is incompatible with the designer</li>
                  <li>Network error while fetching PDF template</li>
                  <li>Browser compatibility issues with PDF rendering</li>
                  <li>Insufficient memory for large PDF files</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-sm">Troubleshooting:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Try uploading a different, smaller PDF file</li>
                  <li>Clear your browser cache and reload the page</li>
                  <li>Ensure your PDF is not password-protected or encrypted</li>
                  <li>Check that the server is running and accessible</li>
                  <li>Try using a different browser if the issue persists</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={this.handleReset} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reset and Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground">
                    Show Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-64">
                    {this.state.errorInfo.componentStack}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PdfmeDesignerErrorBoundary;
