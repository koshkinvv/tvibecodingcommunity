import React from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vibe-coding-theme">
      {children}
    </ThemeProvider>
  );
}
