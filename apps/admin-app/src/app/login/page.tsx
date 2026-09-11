'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      border-radius: 8px;
      background: ${type === 'error' ? '#ef4444' : '#10BF41'};
      color: white;
      font-weight: 600;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          showToast('Invalid email or password', 'error');
          setError('Invalid email or password');
        } else if (signInError.message.includes('Email not confirmed')) {
          showToast('Please verify your email address', 'error');
          setError('Please verify your email address');
        } else {
          showToast(signInError.message, 'error');
          setError(signInError.message);
        }
        return;
      }

      if (!data.user || !data.session) {
        showToast('Login failed. Please try again.', 'error');
        setError('Login failed. Please try again.');
        return;
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', data.session.access_token);
      localStorage.setItem('user_id', data.user.id);

      // Fetch user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        showToast('Failed to fetch user data', 'error');
        setError('Failed to fetch user data');
        return;
      }

      if (!userData.is_active) {
        showToast('Your account has been deactivated', 'error');
        setError('Your account has been deactivated');
        return;
      }

      if (userData.role !== 'admin' && userData.role !== 'super_admin') {
        showToast('Access denied. Admin access required.', 'error');
        setError('Access denied. Admin access required.');
        return;
      }

      showToast('Login successful!', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      showToast('An unexpected error occurred', 'error');
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--app-bg)',
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 40,
          maxWidth: 400,
          width: '100%',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, margin: '0 auto 16', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Image src="/logo.png" width={80} height={80} alt="Yahadeen Logo" loading="eager" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
            Yahadeen Pharm Go
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Admin Console
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yahadeen.com"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--brand)',
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 160ms ease',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => router.push('/forgot-password')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--brand)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
}
