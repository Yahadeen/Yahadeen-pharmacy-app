'use client';

import { useEffect, useState } from 'react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch notifications:', response.status);
        setNotifications([]);
        return;
      }
      
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading notifications...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
            Notifications
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            View system notifications and alerts
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Mark All as Read
        </button>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No notifications
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: notification.read_at ? 'transparent' : 'var(--brand-soft)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      {notification.title}
                    </div>
                    {notification.body && (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                        {notification.body}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!notification.read_at && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--brand)',
                        flexShrink: 0,
                        marginTop: 6,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
