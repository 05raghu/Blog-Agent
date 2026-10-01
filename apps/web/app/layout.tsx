import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import ProtectedLayout from '@/components/protected-layout';

export const metadata: Metadata = {
  title: 'Blog Agent — Content Operating System',
  description: 'Blog Agent V1 - Codewave',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-parchment text-ink-950">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <ProtectedLayout>{children}</ProtectedLayout>
        </Suspense>
      </body>
    </html>
  );
}
