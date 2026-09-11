'use client';

import { useEffect, useState } from 'react';
import { FormModal } from '@/components/form-modal';

interface AdminAccess {
  id: string;
  admin_id: string;
  feature: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  users: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

const FEATURES = [
  { id: 'products', name: 'Products' },
  { id: 'inventory', name: 'Inventory' },
  { id: 'orders', name: 'Orders' },
  { id: 'customers', name: 'Customers' },
  { id: 'attendants', name: 'Attendants' },
  { id: 'payments', name: 'Payments' },
  { id: 'delivery_fees', name: 'Delivery Fees' },
  { id: 'reports', name: 'Reports' },
  { id: 'notifications', name: 'Notifications' },
];

export default function AccessControlPage() {
  const [accessData, setAccessData] = useState<AdminAccess[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    admin_id: '',
    feature: '',
    can_view: true,
    can_create: false,
    can_edit: false,
    can_delete: false,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchAccessData();
    fetchAdmins();
  }, []);

  const fetchAccessData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/access-control', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccessData(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch access data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admins', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdmins(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/access-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setModalOpen(false);
        setFormData({
          admin_id: '',
          feature: '',
          can_view: true,
          can_create: false,
          can_edit: false,
          can_delete: false,
        });
        fetchAccessData();
      }
    } catch (error) {
      console.error('Failed to create access:', error);
    }
  };

  const handleUpdateAccess = async (id: string, updates: Partial<AdminAccess>) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/access-control/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchAccessData();
      }
    } catch (error) {
      console.error('Failed to update access:', error);
    }
  };

  const handleDeleteAccess = async (id: string) => {
    if (!confirm('Are you sure you want to remove this access?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/access-control/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchAccessData();
      }
    } catch (error) {
      console.error('Failed to delete access:', error);
    }
  };

  const getAdminName = (adminId: string) => {
    const admin = admins.find((a) => a.id === adminId);
    return admin?.full_name || admin?.email || 'Unknown';
  };

  const getFeatureName = (featureId: string) => {
    const feature = FEATURES.find((f) => f.id === featureId);
    return feature?.name || featureId;
  };

  // Group access data by admin
  const groupedAccess = accessData.reduce((acc, access) => {
    if (!acc[access.admin_id]) {
      acc[access.admin_id] = {
        admin: access.users,
        features: [],
      };
    }
    acc[access.admin_id].features.push(access);
    return acc;
  }, {} as Record<string, { admin: any; features: AdminAccess[] }>);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Access Control
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Manage admin permissions and feature access
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
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
          Add Access
        </button>
      </div>

      {Object.keys(groupedAccess).length === 0 ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 48,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 8 }}>
            No access rules configured
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>
            Click "Add Access" to configure admin permissions
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(groupedAccess).map(([adminId, data]) => (
            <div
              key={adminId}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {data.admin.full_name || data.admin.email}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {data.admin.role} • {data.admin.email}
                </div>
              </div>

              {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.features.map((access) => (
                    <div
                      key={access.id}
                      style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                        {getFeatureName(access.feature)}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: access.can_view ? 'var(--accent-soft)' : 'rgba(148, 163, 184, 0.1)',
                            color: access.can_view ? 'var(--accent)' : 'var(--text-dim)',
                          }}
                        >
                          View
                        </span>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: access.can_create ? 'var(--accent-soft)' : 'rgba(148, 163, 184, 0.1)',
                            color: access.can_create ? 'var(--accent)' : 'var(--text-dim)',
                          }}
                        >
                          Create
                        </span>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: access.can_edit ? 'var(--accent-soft)' : 'rgba(148, 163, 184, 0.1)',
                            color: access.can_edit ? 'var(--accent)' : 'var(--text-dim)',
                          }}
                        >
                          Edit
                        </span>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: access.can_delete ? 'var(--accent-soft)' : 'rgba(148, 163, 184, 0.1)',
                            color: access.can_delete ? 'var(--accent)' : 'var(--text-dim)',
                          }}
                        >
                          Delete
                        </span>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleUpdateAccess(access.id, { can_view: !access.can_view })}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            background: 'var(--surface-2)',
                            color: 'var(--text)',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Toggle View
                        </button>
                        <button
                          onClick={() => handleDeleteAccess(access.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Feature
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        View
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Create
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Edit
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Delete
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.features.map((access) => (
                      <tr key={access.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text)' }}>
                          {getFeatureName(access.feature)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={access.can_view}
                            onChange={() => handleUpdateAccess(access.id, { can_view: !access.can_view })}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={access.can_create}
                            onChange={() => handleUpdateAccess(access.id, { can_create: !access.can_create })}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={access.can_edit}
                            onChange={() => handleUpdateAccess(access.id, { can_edit: !access.can_edit })}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={access.can_delete}
                            onChange={() => handleUpdateAccess(access.id, { can_delete: !access.can_delete })}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteAccess(access.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      <FormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormData({
            admin_id: '',
            feature: '',
            can_view: true,
            can_create: false,
            can_edit: false,
            can_delete: false,
          });
        }}
        title="Add Access Rule"
        size="md"
      >
        <form onSubmit={handleCreateAccess} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Admin *
            </label>
            <select
              required
              value={formData.admin_id}
              onChange={(e) => setFormData({ ...formData, admin_id: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
              }}
            >
              <option value="">Select an admin</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.full_name || admin.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Feature *
            </label>
            <select
              required
              value={formData.feature}
              onChange={(e) => setFormData({ ...formData, feature: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
              }}
            >
              <option value="">Select a feature</option>
              {FEATURES.map((feature) => (
                <option key={feature.id} value={feature.id}>
                  {feature.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Permissions</label>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={formData.can_view}
                  onChange={(e) => setFormData({ ...formData, can_view: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                View
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={formData.can_create}
                  onChange={(e) => setFormData({ ...formData, can_create: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                Create
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={formData.can_edit}
                  onChange={(e) => setFormData({ ...formData, can_edit: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                Edit
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={formData.can_delete}
                  onChange={(e) => setFormData({ ...formData, can_delete: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                Delete
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
              Cancel
            </button>
            <button
              type="submit"
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
              Add Access
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
