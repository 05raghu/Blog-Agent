'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/auth/login', '/auth/signup', '/auth/callback'];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useWorkspace();

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname?.startsWith(route)
  );

  useEffect(() => {
    // If loading, don't do anything yet
    if (loading) return;

    // If user is not authenticated and not on a public route, redirect to login
    if (!user && !isPublicRoute) {
      console.log('[ProtectedLayout] Redirecting to login:', pathname);
      router.push('/auth/login');
      return;
    }
  }, [user, loading, isPublicRoute, pathname, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-signal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and trying to access protected route, don't render
  if (!user && !isPublicRoute) {
    return null;
  }

  // Render children (either public routes or authenticated users on protected routes)
  return <>{children}</>;
}
