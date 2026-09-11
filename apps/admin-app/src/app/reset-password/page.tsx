'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    // Verify token
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        const data = await response.json();
        setTokenValid(data.valid);
      } catch {
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/confirm-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      router.push('/login?reset=true');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
        Verifying token...
      </div>
    );
  }

  if (tokenValid === false) {
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
            textAlign: 'center',
          }}
        >
          <div style={{ width: 80, height: 80, margin: '0 auto 24' }}>
            <Image src="/logo.png" width={80} height={80} alt="Yahadeen Logo" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px', color: 'var(--text)' }}>
            Invalid Link
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            onClick={() => router.push('/forgot-password')}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

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
            New Password
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Enter your new password
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
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••••"
              required
              minLength={8}
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
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="•••••••••"
              required
              minLength={8}
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
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
