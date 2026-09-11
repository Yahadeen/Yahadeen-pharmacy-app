'use client';

import { useEffect, useState } from 'react';
import { FormModal } from '@/components/form-modal';
import { DetailsModal } from '@/components/details-modal';

export default function AttendantsPage() {
  const [attendants, setAttendants] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAttendant, setSelectedAttendant] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    department: '',
  });
  const [editFormData, setEditFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchAttendants();
    fetchInvites();
  }, []);

  const fetchAttendants = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/attendants', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch attendants:', response.status);
        setAttendants([]);
        return;
      }
      
      const data = await response.json();
      setAttendants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch attendants:', error);
      setAttendants([]);
    }
  };

  const fetchInvites = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/invites?role=attendant', {
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

  const handleCreateAttendant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, role: 'attendant' }),
      });
      if (response.ok) {
        const data = await response.json();
        setCreateModalOpen(false);
        setFormData({ email: '', department: '' });
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

  const handleUpdateAttendant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/attendants/${selectedAttendant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });
      if (response.ok) {
        setEditModalOpen(false);
        setSelectedAttendant(null);
        setEditFormData({ email: '', full_name: '', phone: '' });
        fetchAttendants();
      }
    } catch (error) {
      console.error('Failed to update attendant:', error);
    }
  };

  const openEditModal = (attendant: any) => {
    setSelectedAttendant(attendant);
    setEditFormData({
      email: attendant.email,
      full_name: attendant.full_name || '',
      phone: attendant.phone || '',
    });
    setEditModalOpen(true);
  };

  const openDetailsModal = (attendant: any) => {
    setSelectedAttendant(attendant);
    setDetailsModalOpen(true);
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading attendants...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
            Attendants
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Manage pharmacy staff accounts
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
          Add Attendant
        </button>
      </div>

      {/* Mobile Card View */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {attendants.map((attendant) => (
            <div
              key={attendant.id}
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
                    {attendant.full_name || 'Not set'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {attendant.email}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: attendant.is_active ? 'var(--accent-soft)' : 'rgba(239, 68, 68, 0.1)',
                    color: attendant.is_active ? 'var(--accent)' : '#ef4444',
                  }}
                >
                  {attendant.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Phone</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {attendant.phone || '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Department</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {attendant.department || '-'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openDetailsModal(attendant)}
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
                  onClick={() => openEditModal(attendant)}
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
                  Edit
                </button>
              </div>
            </div>
          ))}
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
                    Status
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Joined
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendants.map((attendant) => (
                  <tr key={attendant.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                      {attendant.full_name || 'Not set'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                      {attendant.email}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                      {attendant.phone || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                      {attendant.department || '-'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          background: attendant.is_active ? 'var(--accent-soft)' : 'rgba(239, 68, 68, 0.1)',
                          color: attendant.is_active ? 'var(--accent)' : '#ef4444',
                        }}
                      >
                        {attendant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                      {new Date(attendant.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openDetailsModal(attendant)}
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
                          onClick={() => openEditModal(attendant)}
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
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Create Attendant Modal */}
      <FormModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setFormData({ email: '', department: '' });
        }}
        title="Invite New Attendant"
        size="sm"
      >
        <form onSubmit={handleCreateAttendant} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
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
        </form>
      </FormModal>

      {/* Edit Attendant Modal */}
      <FormModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAttendant(null);
          setEditFormData({ email: '', full_name: '', phone: '' });
        }}
        title="Edit Attendant"
        size="md"
      >
        <form onSubmit={handleUpdateAttendant} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Full Name *
            </label>
            <input
              type="text"
              value={editFormData.full_name}
              onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
              required
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
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              required
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
              Update Attendant
            </button>
          </div>
        </form>
      </FormModal>

      {/* Attendant Details Modal */}
      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedAttendant(null);
        }}
        title="Attendant Details"
        size="md"
      >
        {selectedAttendant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Full Name
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedAttendant.full_name || 'Not set'}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Email
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedAttendant.email}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Phone
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedAttendant.phone || '-'}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Department
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedAttendant.department || '-'}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Status
              </label>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  background: selectedAttendant.is_active ? 'var(--accent-soft)' : 'rgba(239, 68, 68, 0.1)',
                  color: selectedAttendant.is_active ? 'var(--accent)' : '#ef4444',
                }}
              >
                {selectedAttendant.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Joined Date
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{new Date(selectedAttendant.created_at).toLocaleString()}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Last Updated
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{new Date(selectedAttendant.updated_at).toLocaleString()}</div>
            </div>
          </div>
        )}
      </DetailsModal>
    </div>
  );
}
