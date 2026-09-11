'use client';

import { useEffect, useState } from 'react';
import { FormModal } from '@/components/form-modal';
import { DetailsModal } from '@/components/details-modal';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    role: 'admin',
    department: '',
    access: {} as Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>,
  });
  const [editFormData, setEditFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    department: '',
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchAdmins();
    fetchInvites();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/admins', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch admins:', response.status);
        setAdmins([]);
        return;
      }
      
      const data = await response.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      setAdmins([]);
    }
  };

  const fetchInvites = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/invites?role=admin', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch invites:', response.status);
        setInvites([]);
        return;
      }
      
      const data = await response.json();
      setInvites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch invites:', error);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreateModalOpen(false);
        setFormData({ email: '', role: 'admin', department: '', access: {} });
        alert(`Invite created successfully! Invite code: ${data.invite_code}`);
        fetchInvites();
      } else {
        alert('Failed to create invite');
      }
    } catch (error) {
      console.error('Failed to create invite:', error);
      alert('Failed to create invite');
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      
      if (response.ok) {
        fetchAdmins();
      }
    } catch (error) {
      console.error('Failed to toggle admin status:', error);
    }
  };

  const openViewModal = (admin: any) => {
    setSelectedAdmin(admin);
    setViewModalOpen(true);
  };

  const openEditModal = (admin: any) => {
    setSelectedAdmin(admin);
    setEditFormData({
      email: admin.email,
      full_name: admin.full_name,
      phone: admin.phone,
      department: admin.admin_profiles?.[0]?.department || '',
    });
    setEditModalOpen(true);
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });
      
      if (response.ok) {
        setEditModalOpen(false);
        setSelectedAdmin(null);
        setEditFormData({ email: '', full_name: '', phone: '', department: '' });
        fetchAdmins();
      }
    } catch (error) {
      console.error('Failed to update admin:', error);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading admins...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
            Admin Management
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Manage admin accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
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
          Add Admin
        </button>
      </div>

      {/* Mobile Card View */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {admins.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No admins found
            </div>
          ) : (
            admins.map((admin) => (
              <div
                key={admin.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      {admin.full_name || 'Not set'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {admin.email}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: admin.is_active ? 'var(--brand-soft)' : 'var(--surface-2)',
                      color: admin.is_active ? 'var(--brand)' : 'var(--text-muted)',
                    }}
                  >
                    {admin.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Role</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>
                      {admin.role?.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Department</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                      {admin.admin_profiles?.[0]?.department || 'Not set'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openViewModal(admin)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      color: 'var(--text)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => openEditModal(admin)}
                    disabled={admin.role === 'super_admin'}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      color: 'var(--text)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: admin.role === 'super_admin' ? 'not-allowed' : 'pointer',
                      opacity: admin.role === 'super_admin' ? 0.5 : 1,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                    disabled={admin.role === 'super_admin'}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      color: 'var(--text)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: admin.role === 'super_admin' ? 'not-allowed' : 'pointer',
                      opacity: admin.role === 'super_admin' ? 0.5 : 1,
                    }}
                  >
                    {admin.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Desktop Table View */}
      {!isMobile && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Name
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Email
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Phone
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Department
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Role
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Status
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No admins found
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                        {admin.full_name || 'Not set'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                        {admin.email}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                        {admin.phone || 'Not set'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                        {admin.admin_profiles?.[0]?.department || 'Not set'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)', textTransform: 'capitalize' }}>
                        {admin.role?.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14 }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            background: admin.is_active ? 'var(--brand-soft)' : 'var(--surface-2)',
                            color: admin.is_active ? 'var(--brand)' : 'var(--text-muted)',
                          }}
                        >
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openViewModal(admin)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                              background: 'var(--surface-2)',
                              color: 'var(--text)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(admin)}
                            disabled={admin.role === 'super_admin'}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                              background: 'var(--surface-2)',
                              color: 'var(--text)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: admin.role === 'super_admin' ? 'not-allowed' : 'pointer',
                              opacity: admin.role === 'super_admin' ? 0.5 : 1,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                            disabled={admin.role === 'super_admin'}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                              background: 'var(--surface-2)',
                              color: 'var(--text)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: admin.role === 'super_admin' ? 'not-allowed' : 'pointer',
                              opacity: admin.role === 'super_admin' ? 0.5 : 1,
                            }}
                          >
                            {admin.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Invites Section */}
      {invites.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>
            Pending Invites ({invites.length})
          </h2>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                      Invite Code
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                      Email
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                      Role
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                      Department
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                      Status
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                      Expires
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite) => (
                    <tr key={invite.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                        {invite.code}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                        {invite.email}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)', textTransform: 'capitalize' }}>
                        {invite.role?.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                        {invite.department || '-'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            background: invite.is_used ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent-soft)',
                            color: invite.is_used ? '#ef4444' : 'var(--accent)',
                          }}
                        >
                          {invite.is_used ? 'Used' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                        {new Date(invite.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <FormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Invite New Admin"
        size="sm"
      >
        <form onSubmit={handleCreateAdmin}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Role *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                <option value="admin">Admin</option>
                <option value="attendant">Attendant</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                <option value="">Select a department</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Inventory">Inventory</option>
                <option value="Sales">Sales</option>
                <option value="Management">Management</option>
                <option value="Customer Service">Customer Service</option>
                <option value="Logistics">Logistics</option>
                <option value="Quality Control">Quality Control</option>
                <option value="Executive">Executive</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Feature Access (Optional)
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                Select features this admin can access
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['products', 'inventory', 'orders', 'customers', 'attendants', 'payments', 'delivery_fees', 'reports', 'notifications'].map((feature) => (
                  <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id={`access-${feature}`}
                      checked={formData.access[feature]?.can_view || false}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          access: {
                            ...formData.access,
                            [feature]: {
                              can_view: e.target.checked,
                              can_create: e.target.checked,
                              can_edit: e.target.checked,
                              can_delete: false,
                            },
                          },
                        });
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor={`access-${feature}`} style={{ fontSize: 13, color: 'var(--text)', cursor: 'pointer', textTransform: 'capitalize' }}>
                      {feature.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              An invite code will be generated and sent to the email address. The recipient can use this code to register their account.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
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
                Send Invite
              </button>
            </div>
          </div>
        </form>
      </FormModal>

      {/* View Admin Modal */}
      <DetailsModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAdmin(null);
        }}
        title="Admin Details"
        size="md"
      >
        {selectedAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Full Name</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {selectedAdmin.full_name || 'Not set'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>
                {selectedAdmin.email}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Phone</div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>
                {selectedAdmin.phone || 'Not set'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Department</div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>
                {selectedAdmin.admin_profiles?.[0]?.department || 'Not set'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Role</div>
              <div style={{ fontSize: 14, color: 'var(--text)', textTransform: 'capitalize' }}>
                {selectedAdmin.role?.replace('_', ' ')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>
                {selectedAdmin.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Joined</div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>
                {new Date(selectedAdmin.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </DetailsModal>

      {/* Edit Admin Modal */}
      <FormModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAdmin(null);
          setEditFormData({ email: '', full_name: '', phone: '', department: '' });
        }}
        title="Edit Admin"
        size="md"
      >
        <form onSubmit={handleUpdateAdmin}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
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
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Email *
              </label>
              <input
                type="email"
                required
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
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
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Phone
              </label>
              <input
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
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
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Department
              </label>
              <input
                type="text"
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
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
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
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
                Update Admin
              </button>
            </div>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
