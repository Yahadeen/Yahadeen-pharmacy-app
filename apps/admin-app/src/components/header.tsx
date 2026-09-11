'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, Bell, ChevronRight, ArrowLeft } from 'lucide-react';
import { ConfirmModal } from './confirm-modal';
import { breadcrumbFromPath, titleFromPath } from '@/lib/nav';

interface HeaderProps {
  isMobile: boolean;
  onToggleSidebar: () => void;
  logoutOpen?: boolean;
  onLogoutOpen?: (open: boolean) => void;
  onLogout?: () => void;
}

export function Header({ isMobile, onToggleSidebar, logoutOpen: parentLogoutOpen, onLogoutOpen, onLogout }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLogoutControlled = parentLogoutOpen !== undefined && onLogoutOpen !== undefined && onLogout !== undefined;
  const currentLogoutOpen = isLogoutControlled ? parentLogoutOpen : logoutOpen;
  const handleLogoutOpen = isLogoutControlled ? onLogoutOpen : setLogoutOpen;
  const handleLogout = isLogoutControlled ? onLogout : () => {
    setLogoutOpen(false);
    router.push('/login');
  };

  const crumbs = breadcrumbFromPath(pathname);
  const title = titleFromPath(pathname);
  const isOverview = pathname === '/dashboard';

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await fetch('/api/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data);
          }
        }
      } catch (e) {
        console.error('Failed to fetch user:', e);
      }
    };
    fetchUser();
  }, []);

  const displayName = user?.full_name || 'Admin User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 20px',
        background: 'var(--header-bg)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        marginBottom: 16,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)',
      }}
      className="dashboard-header"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        {!isOverview && (
          <button
            style={{
              position: 'relative',
              width: 40,
              height: 40,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h1
            style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text)', whiteSpace: 'nowrap' }}
            className="dashboard-title"
          >
            {title}
          </h1>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 10 }}
            className="dashboard-crumbs"
          >
            {crumbs.map((c, i) => (
              <span key={c + i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: i === crumbs.length - 1 ? 'var(--text-muted)' : 'var(--text-dim)' }}>
                  {c}
                </span>
                {i < crumbs.length - 1 && <ChevronRight size={12} style={{ color: 'var(--text-dim)' }} />}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} ref={menuRef}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 40,
            padding: '0 14px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            width: 240,
          }}
          className="dashboard-search"
        >
          <Search size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
          <input
            style={{
              flex: 1,
              background: 'transparent',
              border: 0,
              outline: 'none',
              color: 'var(--text)',
              fontSize: 14,
              minWidth: 0,
            }}
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <button
            style={{
              position: 'relative',
              width: 40,
              height: 40,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account menu"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(135deg,var(--brand),var(--accent))',
                  color: '#06121b',
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                {initials}
              </span>
            )}
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 240,
                background: 'var(--modal-bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow: 'var(--shadow)',
                overflow: 'hidden',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: '14px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {user?.email || 'admin@example.com'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textTransform: 'capitalize' }}>
                  {user?.role?.replace('_', ' ') || 'Admin'}
                </div>
              </div>
              <button
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '11px 14px',
                  background: 'transparent',
                  border: 0,
                  color: 'var(--text)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/dashboard/settings');
                }}
              >
                Settings
              </button>
              <button
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '11px 14px',
                  background: 'transparent',
                  border: 0,
                  color: '#f87171',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setMenuOpen(false);
                  handleLogoutOpen(true);
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
