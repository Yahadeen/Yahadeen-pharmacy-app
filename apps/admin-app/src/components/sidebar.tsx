'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ConfirmModal } from './confirm-modal';
import { NAV_ITEMS, NAV_GROUPS } from '@/lib/nav';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from './theme-provider';

interface SidebarProps {
  isMobile: boolean;
  mobileOpen: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
  logoutOpen?: boolean;
  onLogoutOpen?: (open: boolean) => void;
  onLogout?: () => void;
}

export function Sidebar({ isMobile, mobileOpen, collapsed, onCloseMobile, logoutOpen: parentLogoutOpen, onLogoutOpen, onLogout }: SidebarProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const isLogoutControlled = parentLogoutOpen !== undefined && onLogoutOpen !== undefined && onLogout !== undefined;
  const currentLogoutOpen = isLogoutControlled ? parentLogoutOpen : logoutOpen;
  const handleLogoutOpen = isLogoutControlled ? onLogoutOpen : setLogoutOpen;
  const handleLogout = isLogoutControlled ? onLogout : () => {
    setLogoutOpen(false);
    router.push('/login');
  };

  useEffect(() => {
    // Get user role from API
    const fetchUserRole = async () => {
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
            setUserRole(data.role || null);
          }
        }
      } catch (e) {
        console.error('Failed to fetch user role:', e);
      }
    };
    fetchUserRole();
  }, []);

  const showLabels = !collapsed || isMobile;
  const width = collapsed && !isMobile ? 84 : 264;

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <>
      {mobileOpen && isMobile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
            zIndex: 999,
          }}
          onClick={onCloseMobile}
          role="presentation"
        />
      )}

      <aside
        style={{
          background: 'var(--sidebar-bg)',
          border: '1px solid var(--border)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          transition: 'width 180ms ease, left 200ms ease',
          overflow: 'hidden',
          width,
          position: isMobile ? 'fixed' : 'sticky',
          left: isMobile ? (mobileOpen ? 0 : -300) : 'auto',
          top: isMobile ? 0 : 16,
          height: isMobile ? '100vh' : 'calc(100vh - 32px)',
          borderRadius: isMobile ? 0 : 20,
          zIndex: isMobile ? 1000 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', minHeight: 44 }}>
          <div style={{ width: 38, height: 38, position: 'relative' }}>
            <Image src="/logo.png" width={38} height={38} alt="Yahadeen Logo" />
          </div>
          {showLabels && (
            <div>
              <div style={{ fontWeight: 900, letterSpacing: 0.8, fontSize: 15, color: 'var(--text)' }}>
                Yahadeen Pharm Go
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Admin console</div>
            </div>
          )}
        </div>

        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            marginTop: 6,
            flex: 1,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--border) transparent',
          }}
          className="sidebar-nav"
        >
          {NAV_GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((i) => i.group === group);
            if (!items.length) return null;
            return (
              <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {showLabels && (
                  <div
                    style={{
                      color: 'var(--text-dim)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      padding: '0 8px 4px',
                    }}
                  >
                    {group}
                  </div>
                )}
                {items.map((item) => {
                  // Hide super-only items if not super admin
                  if (item.superOnly && userRole !== 'super_admin') {
                    return null;
                  }
                  
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={isMobile ? onCloseMobile : undefined}
                      onMouseEnter={(e) => {
                        if (!showLabels) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            label: item.label,
                            x: rect.right + 8,
                            y: rect.top + rect.height / 2 - 12,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 11,
                        fontSize: 14,
                        fontWeight: 600,
                        transition: 'background 160ms ease, color 160ms ease',
                        justifyContent: showLabels ? 'flex-start' : 'center',
                        background: active ? 'var(--brand-soft)' : 'transparent',
                        border: active ? '1px solid var(--brand-strong)' : '1px solid transparent',
                        color: active ? 'var(--brand)' : 'var(--text-muted)',
                      }}
                    >
                      <Icon size={19} style={{ flexShrink: 0 }} />
                      {showLabels && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 'auto',
            padding: '11px 14px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 14,
            justifyContent: showLabels ? 'flex-start' : 'center',
          }}
          onClick={toggle}
          onMouseEnter={(e) => {
            if (!showLabels) {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                label: theme === 'dark' ? 'Light mode' : 'Dark mode',
                x: rect.right + 8,
                y: rect.top + rect.height / 2 - 12,
              });
            }
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {showLabels && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 14px',
            borderRadius: 12,
            border: '1px solid rgba(239,68,68,0.4)',
            background: 'rgba(239,68,68,0.12)',
            color: '#f87171',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 14,
            justifyContent: showLabels ? 'center' : 'center',
          }}
          onClick={() => handleLogoutOpen(true)}
          onMouseEnter={(e) => {
            if (!showLabels) {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                label: 'Sign out',
                x: rect.right + 8,
                y: rect.top + rect.height / 2 - 12,
              });
            }
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <LogOut size={18} />
          {showLabels && <span>Sign out</span>}
        </button>
      </aside>

      {tooltip && (
        <div
          className={`sidebar-tooltip ${tooltip ? 'visible' : ''}`}
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          {tooltip.label}
        </div>
      )}
    </>
  );
}
