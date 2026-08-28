import { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/features/auth/services/auth.service';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    authService.getProfile()
      .then((user) => setAuth(user as Parameters<typeof setAuth>[0]))
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  }, [setAuth, clearAuth, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-primary-light text-white border-primary',
          style: {
            background: 'var(--color-primary-light)',
            color: 'white',
            border: '1px solid var(--color-primary-base)',
          }
        }}
      />
    </QueryClientProvider>
  );
};
