import { verifyToken } from './supabase';
import { NextRequest } from 'next/server';

export interface AuthContext {
  userId: string;
  role: 'customer' | 'attendant' | 'admin' | 'super_admin';
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const result = await verifyToken(token);

  if (!result) {
    return null;
  }

  return {
    userId: result.userId,
    role: result.role as AuthContext['role'],
  };
}

export function requireRole(auth: AuthContext | null, allowedRoles: AuthContext['role'][]): AuthContext {
  if (!auth) {
    throw new Error('Unauthorized');
  }

  if (!allowedRoles.includes(auth.role)) {
    throw new Error('Forbidden');
  }

  return auth;
}

export function requireAdmin(auth: AuthContext | null): AuthContext {
  return requireRole(auth, ['admin', 'super_admin']);
}

export function requireStaff(auth: AuthContext | null): AuthContext {
  return requireRole(auth, ['attendant', 'admin', 'super_admin']);
}

export function requireSuperAdmin(auth: AuthContext | null): AuthContext {
  return requireRole(auth, ['super_admin']);
}

export function requireCustomer(auth: AuthContext | null): AuthContext {
  return requireRole(auth, ['customer']);
}
