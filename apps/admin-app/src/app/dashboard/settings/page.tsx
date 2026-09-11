'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setAvatarPreview(data.avatar_url || null);
      } else if (response.status === 401) {
        console.error('Authentication failed - token may be expired or invalid');
        setAuthError(true);
        // Optionally redirect to login
        // window.location.href = '/login';
      } else {
        console.error('Failed to fetch user details:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // Upload to Cloudflare
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        toast.error(error.error || 'Failed to upload image');
        return;
      }

      const uploadData = await uploadResponse.json();
      
      // Update user profile with new avatar URL
      const updateResponse = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_url: uploadData.url }),
      });

      if (updateResponse.ok) {
        setAvatarPreview(uploadData.url);
        setUser({ ...user, avatar_url: uploadData.url });
        toast.success('Avatar updated successfully!');
      } else {
        toast.error('Failed to update avatar');
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Configure your pharmacy settings and preferences
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* User Profile Section */}
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading profile...</div>
        ) : authError ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>
              Authentication Error
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              Your session has expired or is invalid. Please log in again.
            </div>
            <button
              onClick={() => (window.location.href = '/login')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--brand)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Go to Login
            </button>
          </div>
        ) : user ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)' }}>
              Profile Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  Avatar
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'var(--surface-2)',
                      border: '2px solid var(--border)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>👤</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="avatar-upload"
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--surface-2)',
                        color: 'var(--text)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        display: 'inline-block',
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Upload New Avatar'}
                    </label>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      JPEG, PNG, WebP, or GIF (max 5MB)
                    </div>
                  </div>
                </div>
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
                  Full Name
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{user.full_name || 'Not set'}</div>
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
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{user.email}</div>
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
                  Phone
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{user.phone || 'Not set'}</div>
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
                  Role
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)', textTransform: 'capitalize' }}>
                  {user.role?.replace('_', ' ') || 'Not set'}
                </div>
              </div>
              {user.department && (
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
                  <div style={{ fontSize: 14, color: 'var(--text)' }}>{user.department}</div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
