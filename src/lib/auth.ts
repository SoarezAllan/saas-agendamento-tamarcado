import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_saas_agendamento_2026';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'PROFESSIONAL' | 'CUSTOMER';
  businessId?: string | null;
  professionalId?: string | null;
  customerId?: string | null;
  phone?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (error) {
    return null;
  }
}

export async function getSession(req?: NextRequest): Promise<UserSession | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    if (!token) {
      token = req.cookies.get('auth_token')?.value;
    }
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value;
  }

  if (!token) return null;
  return verifyToken(token);
}

export function createAuthResponse(data: any, session: UserSession, status = 200) {
  const token = signToken(session);
  const response = NextResponse.json(data, { status });

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}

