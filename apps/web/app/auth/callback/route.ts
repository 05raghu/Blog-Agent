// Auth callback handler for email confirmation
// Supabase redirects here after user confirms their email

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const error = request.nextUrl.searchParams.get('error');

    // Handle errors from Supabase
    if (error) {
      const errorDescription = request.nextUrl.searchParams.get('error_description');
      console.error('[Auth] Callback error:', error, errorDescription);

      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
      );
    }

    // Code is exchanged for session by Supabase client
    // No server-side exchange needed with createBrowserClient
    if (code) {
      console.log('[Auth] Callback received code, redirecting to overview');
      return NextResponse.redirect(new URL('/overview', request.url));
    }

    // No code or error - redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url));
  } catch (error) {
    console.error('[Auth] Callback handler error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url));
  }
}
