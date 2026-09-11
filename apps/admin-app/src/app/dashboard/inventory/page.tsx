'use client';

import { useEffect, useState } from 'react';
import { FormModal } from '@/components/form-modal';
import { DetailsModal } from '@/components/details-modal';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustData, setAdjustData] = useState({ quantity: '', reason: '' });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [filter]);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch inventory:', response.status);
        setInventory([]);
        return;
      }
      
      const data = await response.json();
      const dataArray = Array.isArray(data) ? data : [];
      
      let filtered = dataArray;
      if (filter === 'low') {
        filtered = dataArray.filter((p: any) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold);
      } else if (filter === 'out') {
        filtered = dataArray.filter((p: any) => p.stock_quantity === 0);
      }
      
      setInventory(filtered);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/inventory/${selectedItem.product_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseInt(adjustData.quantity),
          reason: adjustData.reason,
        }),
      });
      if (response.ok) {
        setAdjustModalOpen(false);
        setAdjustData({ quantity: '', reason: '' });
        setSelectedItem(null);
        fetchInventory();
      }
    } catch (error) {
      console.error('Failed to adjust stock:', error);
    }
  };

  const openAdjustModal = (item: any) => {
    setSelectedItem(item);
    setAdjustModalOpen(true);
  };

  const openDetailsModal = (item: any) => {
    setSelectedItem(item);
    setDetailsModalOpen(true);
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading inventory...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
          Inventory
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Monitor and manage stock levels
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: filter === 'all' ? '1px solid var(--brand)' : '1px solid var(--border)',
            background: filter === 'all' ? 'var(--brand-soft)' : 'var(--surface-2)',
            color: filter === 'all' ? 'var(--brand)' : 'var(--text)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          All Items
        </button>
        <button
          onClick={() => setFilter('low')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: filter === 'low' ? '1px solid #f59e0b' : '1px solid var(--border)',
            background: filter === 'low' ? 'rgba(245, 158, 11, 0.1)' : 'var(--surface-2)',
            color: filter === 'low' ? '#f59e0b' : 'var(--text)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Low Stock
        </button>
        <button
          onClick={() => setFilter('out')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: filter === 'out' ? '1px solid #ef4444' : '1px solid var(--border)',
            background: filter === 'out' ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-2)',
            color: filter === 'out' ? '#ef4444' : 'var(--text)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Out of Stock
        </button>
      </div>

      {/* Mobile Card View */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {inventory.map((item) => {
            const isLow = item.stock_quantity > 0 && item.stock_quantity <= item.low_stock_threshold;
            const isOut = item.stock_quantity === 0;
            
            return (
              <div
                key={item.id}
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
                      {item.name}
                    </div>
                  </div>
                  {isOut ? (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                      }}
                    >
                      Out of Stock
                    </span>
                  ) : isLow ? (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                      }}
                    >
                      Low Stock
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                      }}
                    >
                      In Stock
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Current Stock</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                      {item.stock_quantity}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Threshold</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                      {item.low_stock_threshold}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openDetailsModal(item)}
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
                    onClick={() => openAdjustModal(item)}
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
                    Adjust
                  </button>
                </div>
              </div>
            );
          })}
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
                    Product
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Current Stock
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Low Stock Threshold
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
                {inventory.map((item) => {
                  const isLow = item.stock_quantity > 0 && item.stock_quantity <= item.low_stock_threshold;
                  const isOut = item.stock_quantity === 0;
                  
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                        {item.stock_quantity}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                        {item.low_stock_threshold}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {isOut ? (
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                            }}
                          >
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              background: 'rgba(245, 158, 11, 0.1)',
                              color: '#f59e0b',
                            }}
                          >
                            Low Stock
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              background: 'var(--accent-soft)',
                              color: 'var(--accent)',
                            }}
                          >
                            In Stock
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openDetailsModal(item)}
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
                            onClick={() => openAdjustModal(item)}
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
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <FormModal
        isOpen={adjustModalOpen}
        onClose={() => {
          setAdjustModalOpen(false);
          setSelectedItem(null);
          setAdjustData({ quantity: '', reason: '' });
        }}
        title="Adjust Stock"
        size="md"
      >
        {selectedItem && (
          <form onSubmit={handleAdjustStock} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Product
              </label>
              <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{selectedItem.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Stock: {selectedItem.stock_quantity}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Adjustment Quantity *
              </label>
              <input
                type="number"
                value={adjustData.quantity}
                onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                required
                placeholder="Use positive to add, negative to remove"
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
                Reason *
              </label>
              <textarea
                value={adjustData.reason}
                onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                required
                rows={3}
                placeholder="e.g., Restock from supplier, Damaged goods, etc."
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
              Adjust Stock
            </button>
          </form>
        )}
      </FormModal>

      {/* Inventory Details Modal */}
      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedItem(null);
        }}
        title="Inventory Details"
        size="md"
      >
        {selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Product Name
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedItem.name}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Current Stock
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{selectedItem.stock_quantity}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Low Stock Threshold
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedItem.low_stock_threshold}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Price
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>₦{((selectedItem.price_kobo || 0) / 100).toLocaleString()}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Status
                </label>
                {selectedItem.stock_quantity === 0 ? (
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                    }}
                  >
                    Out of Stock
                  </span>
                ) : selectedItem.stock_quantity <= selectedItem.low_stock_threshold ? (
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(245, 158, 11, 0.1)',
                      color: '#f59e0b',
                    }}
                  >
                    Low Stock
                  </span>
                ) : (
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                  >
                    In Stock
                  </span>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Product Status
                </label>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: selectedItem.is_active ? 'var(--accent-soft)' : 'rgba(239, 68, 68, 0.1)',
                    color: selectedItem.is_active ? 'var(--accent)' : '#ef4444',
                  }}
                >
                  {selectedItem.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            {selectedItem.description && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Description
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedItem.description}</div>
              </div>
            )}
          </div>
        )}
      </DetailsModal>
    </div>
  );
}
