import type { Metadata } from 'next';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}
