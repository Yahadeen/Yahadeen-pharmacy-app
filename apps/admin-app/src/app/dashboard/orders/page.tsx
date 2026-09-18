'use client';

import { useEffect, useState } from 'react';
import { FormModal } from '@/components/form-modal';
import { DetailsModal } from '@/components/details-modal';
import { Eye, FileText, ImageIcon, Package, X } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [prescriptionPreviewUrl, setPrescriptionPreviewUrl] = useState<string | null>(null);
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
        console.error('Failed to fetch orders:', response.status, response.statusText);
        setOrders([]);
        return;
      }
      
      const data = await response.json();
      console.log('Orders data:', data);
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
        method: 'PATCH',
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

  const openDetailsModal = async (order: any) => {
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    setSelectedOrder(order);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/orders/${order.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSelectedOrder(await response.json());
      } else {
        console.error('Failed to fetch order details:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setDetailsLoading(false);
    }
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

  const orderItems = selectedOrder?.items || selectedOrder?.order_items || [];
  const selectedAddress = selectedOrder?.address || selectedOrder?.addresses || selectedOrder?.address_snapshot;
  const selectedCustomer = selectedOrder?.customer || selectedOrder?.users;

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
          setPrescriptionPreviewUrl(null);
        }}
        title="Order Details"
        size="xl"
      >
        {detailsLoading ? (
          <div style={{ color: 'var(--text-muted)', padding: 24 }}>Loading order details...</div>
        ) : selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
                gap: 16,
              }}
            >
              <section style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Order</div>
                    <div style={{ fontSize: 20, color: 'var(--text)', fontWeight: 800 }}>{selectedOrder.code}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      background: `${getStatusColor(selectedOrder.status)}20`,
                      color: getStatusColor(selectedOrder.status),
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatStatus(selectedOrder.status)}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <Metric label="Subtotal" value={formatCurrency(selectedOrder.subtotal_kobo || 0)} />
                  <Metric label="Delivery" value={formatCurrency(selectedOrder.delivery_fee_kobo || 0)} />
                  <Metric label="Total" value={formatCurrency(selectedOrder.total_kobo || 0)} strong />
                </div>

                {!!selectedOrder.cancellation_reason && (
                  <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#ef444420', color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
                    Cancellation reason: {selectedOrder.cancellation_reason}
                  </div>
                )}
              </section>

              <section style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10 }}>Customer</div>
                <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 700 }}>
                  {selectedCustomer?.full_name || selectedAddress?.full_name || selectedOrder.customer_id || '-'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {selectedCustomer?.phone || selectedAddress?.phone || '-'}
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>Delivery address</div>
                <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                  {selectedAddress
                    ? [selectedAddress.address_line1, selectedAddress.address_line2, selectedAddress.city, selectedAddress.state]
                        .filter(Boolean)
                        .join(', ')
                    : selectedOrder.address_id || '-'}
                </div>
                {!!selectedOrder.notes && (
                  <>
                    <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>Customer note</div>
                    <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{selectedOrder.notes}</div>
                  </>
                )}
              </section>
            </div>

            <section style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Package size={16} color="var(--text-muted)" />
                <h3 style={{ fontSize: 16, margin: 0, color: 'var(--text)', fontWeight: 800 }}>
                  Products ({orderItems.length})
                </h3>
              </div>
              {orderItems.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {orderItems.map((item: any, index: number) => {
                    const product = item.product || item.products || {};
                    const imageUrl = item.image_url_snapshot || product.image_url;
                    const name = product.name || item.name_snapshot || `Product ${item.product_id || index + 1}`;
                    return (
                      <div
                        key={item.id || `${item.product_id}-${index}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '52px 1fr auto',
                          gap: 12,
                          alignItems: 'center',
                          padding: 12,
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          background: 'var(--surface-2)',
                        }}
                      >
                        {imageUrl ? (
                          <img src={imageUrl} alt={name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }} />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={18} color="var(--text-muted)" />
                          </div>
                        )}
                        <div>
                          <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 800 }}>{name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>
                            {item.pack_size_snapshot || product.pack_size || 'Pack details unavailable'}
                            {item.product_id ? ` · ${item.product_id}` : ''}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>
                            {formatCurrency(item.unit_price_kobo || 0)} each · Qty {item.quantity}
                          </div>
                        </div>
                        <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 800, textAlign: 'right' }}>
                          {formatCurrency(item.total_kobo || (item.unit_price_kobo || 0) * (item.quantity || 0))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No products were returned for this order.</div>
              )}
            </section>

            <section style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FileText size={16} color="var(--text-muted)" />
                <h3 style={{ fontSize: 16, margin: 0, color: 'var(--text)', fontWeight: 800 }}>Prescription</h3>
              </div>
              {selectedOrder.prescription_url ? (
                <button
                  type="button"
                  onClick={() => setPrescriptionPreviewUrl(selectedOrder.prescription_url)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/\.(png|jpe?g|webp|gif)$/i.test(selectedOrder.prescription_url) ? (
                    <img src={selectedOrder.prescription_url} alt="Prescription" style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <div style={{ width: 76, height: 76, borderRadius: 8, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={24} color="var(--text-muted)" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 800 }}>Uploaded prescription</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>Click to view full screen</div>
                  </div>
                  <Eye size={18} color="var(--text-muted)" />
                </button>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No prescription attached to this order.</div>
              )}
            </section>
          </div>
        )}
      </DetailsModal>

      {prescriptionPreviewUrl && (
        <div
          onClick={() => setPrescriptionPreviewUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(0,0,0,0.86)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <button
            type="button"
            aria-label="Close prescription preview"
            onClick={() => setPrescriptionPreviewUrl(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 42,
              height: 42,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.24)',
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={22} />
          </button>
          {/\.(png|jpe?g|webp|gif)$/i.test(prescriptionPreviewUrl) ? (
            <img
              src={prescriptionPreviewUrl}
              alt="Prescription full preview"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
            />
          ) : (
            <iframe
              src={prescriptionPreviewUrl}
              title="Prescription full preview"
              onClick={(e) => e.stopPropagation()}
              style={{ width: 'min(100%, 1000px)', height: '90vh', border: 'none', borderRadius: 8, background: '#fff' }}
            />
          )}
        </div>
      )}

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

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: strong ? 16 : 14, color: 'var(--text)', fontWeight: strong ? 900 : 700 }}>
        {value}
      </div>
    </div>
  );
}
