'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SignupPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'verify' | 'register'>('verify');
  const [inviteData, setInviteData] = useState<any>(null);
  const [department, setDepartment] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handleVerifyInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify invite code with backend
      const response = await fetch('/api/invites/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid invite code');
      }

      setInviteData(data);
      setStep('register');
    } catch (err: any) {
      setError(err.message || 'Failed to verify invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/invites/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: inviteCode,
          email,
          full_name: fullName,
          phone,
          password,
          department: inviteData?.role === 'admin' ? department : undefined,
          permissions: inviteData?.role === 'admin' ? selectedPermissions : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const departments = [
    'Operations',
    'Inventory Management',
    'Order Fulfillment',
    'Customer Support',
    'Finance',
    'Human Resources',
    'Marketing',
  ];

  const availablePermissions = [
    'manage_users',
    'manage_products',
    'manage_inventory',
    'manage_orders',
    'manage_categories',
    'view_analytics',
    'manage_staff',
    'manage_settings',
  ];

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
          maxWidth: 450,
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
            Admin Console - Sign Up
          </p>
        </div>

        {step === 'verify' ? (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 24 }}>
              Admin access is by invitation only. Please enter your invite code to continue.
            </p>
            <form onSubmit={handleVerifyInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
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
                    textTransform: 'uppercase',
                    letterSpacing: 2,
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
                {loading ? 'Verifying...' : 'Verify Invite Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 24 }}>
              Create your admin account
            </p>
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
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
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 XXX XXX XXXX"
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
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
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

              {inviteData?.role === 'admin' && (
                <>
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
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
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
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: 8,
                      }}
                    >
                      Permissions
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {availablePermissions.map((permission) => (
                        <label
                          key={permission}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: selectedPermissions.includes(permission)
                              ? 'var(--brand)'
                              : 'var(--surface-2)',
                            color: selectedPermissions.includes(permission)
                              ? 'white'
                              : 'var(--text)',
                            transition: 'background 160ms ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                            style={{ display: 'none' }}
                          />
                          {permission.replace(/_/g, ' ').toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

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
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
