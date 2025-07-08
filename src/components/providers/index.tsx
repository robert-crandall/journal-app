'use client';

import AuthProvider from './AuthProvider';
import ThemeProvider from './ThemeProvider';
import TRPCProvider from './TRPCProvider';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TRPCProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </TRPCProvider>
    </AuthProvider>
  );
}
