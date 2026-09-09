import { type ReactNode, useEffect } from 'react';
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
          className: 'bg-white text-primary border-orange-200/60 shadow-lg',
          style: {
            background: '#ffffff',
            color: 'var(--color-primary-base)',
            border: '1px solid rgba(247, 127, 82, 0.25)',
          },
          classNames: {
            toast: 'bg-white text-primary border border-orange-200/60 shadow-lg font-sans',
            title: 'text-primary font-bold text-sm',
            description: 'text-gray-500 text-xs mt-0.5',
            actionButton: 'bg-primary text-white text-xs px-3 py-1.5 rounded-lg',
            cancelButton: 'bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg',
          },
        }}
      />
    </QueryClientProvider>
  );
};
