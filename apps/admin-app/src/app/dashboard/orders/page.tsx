'use client';

import { useEffect, useState } from 'react';
import { FormModal } from '@/components/form-modal';
import { DetailsModal } from '@/components/details-modal';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusData, setStatusData] = useState({ status: '', cancellation_reason: '' });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = statusFilter ? `/api/orders?status=${statusFilter}` : '/api/orders';
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch orders:', response.status);
        setOrders([]);
        return;
      }
      
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusData),
      });
      if (response.ok) {
        setStatusModalOpen(false);
        setStatusData({ status: '', cancellation_reason: '' });
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const openDetailsModal = (order: any) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  const openStatusModal = (order: any) => {
    setSelectedOrder(order);
    setStatusData({ status: order.status, cancellation_reason: '' });
    setStatusModalOpen(true);
  };

  const formatCurrency = (kobo: number) => {
    return `₦${(kobo / 100).toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: '#f59e0b',
      paid: '#3b82f6',
      confirmed: '#8b5cf6',
      preparing: '#06b6d4',
      packed: '#14b8a6',
      ready_for_pickup: '#10b981',
      picked_up: '#6366f1',
      out_for_delivery: '#8b5cf6',
      delivered: '#10bf41',
      cancelled: '#ef4444',
      payment_failed: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading orders...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
          Orders
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          View and manage customer orders
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Filter:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
          }}
        >
          <option value="">All Statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="paid">Paid</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="packed">Packed</option>
          <option value="ready_for_pickup">Ready for Pickup</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Mobile Card View */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((order) => (
            <div
              key={order.id}
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
                    {order.code}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: `${getStatusColor(order.status)}20`,
                    color: getStatusColor(order.status),
                  }}
                >
                  {formatStatus(order.status)}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Customer</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {order.customer_id || '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Total</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {formatCurrency(order.total_kobo)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openDetailsModal(order)}
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
                  onClick={() => openStatusModal(order)}
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
                  Update Status
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
                    Order Code
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Customer
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Total
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Status
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Date
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                      {order.code}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                      {order.customer_id || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                      {formatCurrency(order.total_kobo)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          background: `${getStatusColor(order.status)}20`,
                          color: getStatusColor(order.status),
                        }}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openDetailsModal(order)}
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
                          onClick={() => openStatusModal(order)}
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
                          Update Status
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

      {/* Order Details Modal */}
      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedOrder(null);
        }}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Order Code
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{selectedOrder.code}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Customer ID
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedOrder.customer_id || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Total Amount
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(selectedOrder.total_kobo)}</div>
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
                    background: `${getStatusColor(selectedOrder.status)}20`,
                    color: getStatusColor(selectedOrder.status),
                  }}
                >
                  {formatStatus(selectedOrder.status)}
                </span>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Created At
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{new Date(selectedOrder.created_at).toLocaleString()}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Delivery Address
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedOrder.address_id || '-'}</div>
              </div>
            </div>
            {selectedOrder.notes && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Notes
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedOrder.notes}</div>
              </div>
            )}
          </div>
        )}
      </DetailsModal>

      {/* Update Status Modal */}
      <FormModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedOrder(null);
          setStatusData({ status: '', cancellation_reason: '' });
        }}
        title="Update Order Status"
        size="md"
      >
        {selectedOrder && (
          <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Order Code
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{selectedOrder.code}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Status: {formatStatus(selectedOrder.status)}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                New Status *
              </label>
              <select
                value={statusData.status}
                onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
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
              >
                <option value="pending_payment">Pending Payment</option>
                <option value="paid">Paid</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="packed">Packed</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="picked_up">Picked Up</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {statusData.status === 'cancelled' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Cancellation Reason *
                </label>
                <textarea
                  value={statusData.cancellation_reason}
                  onChange={(e) => setStatusData({ ...statusData, cancellation_reason: e.target.value })}
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            )}
            <button
              type="submit"
              style={{
                padding: '12px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--brand)',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Update Status
            </button>
          </form>
        )}
      </FormModal>
    </div>
  );
}
