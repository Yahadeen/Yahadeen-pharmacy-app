'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
          <div style={{ width: 80, height: 80, margin: '0 auto 24', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Image src="/logo.png" width={80} height={80} alt="Yahadeen Logo" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px', color: 'var(--text)' }}>
            Check Your Email
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
          </p>
          <button
            onClick={() => router.push('/login')}
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
            Back to Login
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
            <Image src="/logo.png" width={80} height={80} alt="Yahadeen Logo" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
            Reset Password
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Enter your email to receive a reset link
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
            {loading ? 'Sending...' : 'Send Reset Link'}
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
