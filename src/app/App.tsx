import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Providers } from './providers';
import { AppRouter } from './router';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

function App() {
  return (
    <Providers>
      <BrowserRouter>
        {/* App-level last resort: a render crash anywhere shows a recoverable
            screen instead of a blank page. Page-level isolation lives in
            DashboardLayout so the shell survives content crashes. */}
        <ErrorBoundary variant="app">
          <AppRouter />
        </ErrorBoundary>
      </BrowserRouter>
    </Providers>
  );
}

export default App;
