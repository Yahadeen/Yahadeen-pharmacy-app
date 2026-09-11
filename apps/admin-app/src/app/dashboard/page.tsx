'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardOverview() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total_revenue_kobo: 0,
    total_orders: 0,
    pending_orders: 0,
    low_stock_count: 0,
    active_customers: 0,
    active_attendants: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch stats from API
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // On error, redirect to login
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  const formatCurrency = (kobo: number) => {
    return `₦${(kobo / 100).toLocaleString()}`;
  };

  const StatCard = ({ title, value, subtitle, color }: { title: string; value: string; subtitle?: string; color: string }) => (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{subtitle}</div>}
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
          Dashboard Overview
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Welcome back! Here's what's happening with your pharmacy today.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
        className="page-stats"
      >
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.total_revenue_kobo)}
          subtitle="All time"
          color="var(--brand)"
        />
        <StatCard
          title="Total Orders"
          value={stats.total_orders.toString()}
          subtitle="All orders"
          color="var(--accent)"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pending_orders.toString()}
          subtitle="Needs attention"
          color="#f59e0b"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.low_stock_count.toString()}
          subtitle="Restock needed"
          color="#ef4444"
        />
        <StatCard
          title="Active Customers"
          value={stats.active_customers.toString()}
          subtitle="Registered users"
          color="var(--brand)"
        />
        <StatCard
          title="Active Attendants"
          value={stats.active_attendants.toString()}
          subtitle="Staff members"
          color="var(--accent)"
        />
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
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
            onClick={() => (window.location.href = '/dashboard/products')}
          >
            Add Product
          </button>
          <button
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
            onClick={() => (window.location.href = '/dashboard/orders')}
          >
            View Orders
          </button>
          <button
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
            onClick={() => (window.location.href = '/dashboard/inventory')}
          >
            Check Inventory
          </button>
          <button
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
            onClick={() => (window.location.href = '/dashboard/reports')}
          >
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}
