'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AudioEngine } from '@/components/AudioEngine';
import { Toaster } from '@/components/Toaster';
import { SessionBootstrap } from '@/components/SessionBootstrap';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AudioEngine />
      <SessionBootstrap />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
