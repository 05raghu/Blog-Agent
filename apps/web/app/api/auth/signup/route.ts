import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { createServerClient } from '@/lib/workspace-auth';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'blog-agent-dev-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, workspaceName, workspaceSlug, role = 'admin' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        password_hash: passwordHash,
      });

    if (userError) {
      console.error('[Auth] User creation error:', userError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      );
    }

    // Create workspace if provided
    let workspaceId = null;
    if (workspaceName && workspaceSlug) {
      workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const { error: wsError } = await supabase
        .from('workspaces')
        .insert({
          id: workspaceId,
          name: workspaceName,
          slug: workspaceSlug,
          description: `${workspaceName} workspace`,
          config: {},
        });

      if (wsError) {
        console.error('[Auth] Workspace creation error:', wsError);
        return NextResponse.json(
          { error: 'Failed to create workspace' },
          { status: 400 }
        );
      }

      // Create membership with provided role
      const { error: memError } = await supabase
        .from('memberships')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          role,
        });

      if (memError) {
        console.error('[Auth] Membership creation error:', memError);
        return NextResponse.json(
          { error: 'Failed to create membership' },
          { status: 400 }
        );
      }
    }

    // Generate JWT token with role
    const userRole = workspaceId ? role : 'marketer';
    const token = jwt.sign(
      { userId, email, workspaceId, role: userRole },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Create response and set cookie
    const response = NextResponse.json({
      success: true,
      token,
      user: { id: userId, email },
      workspace: workspaceId ? { id: workspaceId, name: workspaceName } : null,
    });

    // Set HTTP-only cookie so browser automatically sends token with requests
    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to sign up', message: (error as Error).message },
      { status: 500 }
    );
  }
}
