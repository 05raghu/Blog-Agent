import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { createServerClient } from '@/lib/workspace-auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user's workspace(s)
    const { data: membership } = await supabase
      .from('memberships')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .single();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        workspaceId: membership?.workspace_id || null,
        role: membership?.role || 'marketer'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, email: user.email },
      workspace: membership ? { id: membership.workspace_id } : null,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login', message: (error as Error).message },
      { status: 500 }
    );
  }
}
