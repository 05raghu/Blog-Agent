import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // Create response and clear auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear the auth token cookie
    response.cookies.delete('authToken');

    return response;
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout', message: (error as Error).message },
      { status: 500 }
    );
  }
}
