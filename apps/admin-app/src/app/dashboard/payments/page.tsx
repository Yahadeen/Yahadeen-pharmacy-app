'use client';

import { useEffect, useState } from 'react';
import { DetailsModal } from '@/components/details-modal';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = statusFilter === 'all' 
        ? '/api/admin/payments' 
        : `/api/admin/payments?status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch payments:', response.status);
        setPayments([]);
        return;
      }
      
      const data = await response.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (payment: any) => {
    setSelectedPayment(payment);
    setDetailsModalOpen(true);
  };

  const handleReverifyPayment = async (paymentId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Payment status updated successfully');
        fetchPayments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Failed to reverify payment:', error);
      alert('Failed to verify payment');
    }
  };

  const formatCurrency = (kobo: number) => {
    return `₦${(kobo / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return { background: 'var(--accent-soft)', color: 'var(--accent)' };
      case 'pending':
        return { background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' };
      case 'failed':
        return { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      default:
        return { background: 'var(--surface-2)', color: 'var(--text-muted)' };
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading payments...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
            Payments
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            View and manage payment transactions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payments.map((payment) => (
            <div
              key={payment.id}
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
                    {formatCurrency(payment.amount_kobo)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {payment.payment_method}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    ...getStatusColor(payment.status),
                  }}
                >
                  {payment.status}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Reference</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all' }}>
                    {payment.payment_reference?.slice(0, 12) || '-'}...
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Date</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    {new Date(payment.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openDetailsModal(payment)}
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
                {payment.status === 'pending' && payment.payment_reference && (
                  <button
                    onClick={() => handleReverifyPayment(payment.id)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--brand)',
                      background: 'var(--brand-soft)',
                      color: 'var(--brand)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Reverify
                  </button>
                )}
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
                    Reference
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Order ID
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Amount
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Method
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Status
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Paid At
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Created
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                      {payment.payment_reference || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                      {payment.order_id?.slice(0, 8) || '-'}...
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                      {formatCurrency(payment.amount_kobo)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                      {payment.payment_method}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          ...getStatusColor(payment.status),
                        }}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                      {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openDetailsModal(payment)}
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
                        {payment.status === 'pending' && payment.payment_reference && (
                          <button
                            onClick={() => handleReverifyPayment(payment.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px solid var(--brand)',
                              background: 'var(--brand-soft)',
                              color: 'var(--brand)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Reverify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedPayment(null);
        }}
        title="Payment Details"
        size="md"
      >
        {selectedPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Payment Reference
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedPayment.payment_reference || '-'}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Order ID
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedPayment.order_id || '-'}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Amount
              </label>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
                {formatCurrency(selectedPayment.amount_kobo)}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Payment Method
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedPayment.payment_method}</div>
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
                  ...getStatusColor(selectedPayment.status),
                }}
              >
                {selectedPayment.status}
              </span>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Paid At
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>
                {selectedPayment.paid_at ? new Date(selectedPayment.paid_at).toLocaleString() : 'Not paid yet'}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Created At
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>
                {new Date(selectedPayment.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </DetailsModal>
    </div>
  );
}
