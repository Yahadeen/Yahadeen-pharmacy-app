'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ThemeProvider } from './theme-provider';
import { ConfirmModal } from './confirm-modal';

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    setLogoutOpen(false);
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  // Gate the dashboard: without auth, redirect to login
  useEffect(() => {
    // For demo purposes, we'll skip auth check
    // In production, verify token here
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const onToggleSidebar = () => {
    if (isMobile) setMobileOpen((v) => !v);
    else setCollapsed((v) => !v);
  };

  return (
    <ThemeProvider>
      {!authChecked ? (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text-muted)',
            background: 'var(--app-bg)',
          }}
        >
          Checking access…
        </div>
      ) : (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            gap: 16,
            padding: 16,
            background: 'var(--app-bg)',
          }}
          className="dashboard-shell"
        >
          <Sidebar
            isMobile={isMobile}
            mobileOpen={mobileOpen}
            collapsed={collapsed}
            onCloseMobile={() => setMobileOpen(false)}
            logoutOpen={logoutOpen}
            onLogoutOpen={setLogoutOpen}
            onLogout={handleLogout}
          />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <Header isMobile={isMobile} onToggleSidebar={onToggleSidebar} logoutOpen={logoutOpen} onLogoutOpen={setLogoutOpen} onLogout={handleLogout} />
            <main
              style={{
                flex: 1,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 24,
                overflow: 'auto',
                minHeight: 0,
              }}
              className="dashboard-main"
            >
              {children}
            </main>
          </div>
        </div>
      )}

      <ConfirmModal
        open={logoutOpen}
        title="Sign out?"
        message="You will be returned to the login screen and will need to sign in again."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </ThemeProvider>
  );
}
