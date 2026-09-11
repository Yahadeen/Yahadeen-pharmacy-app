'use client';

import { useEffect, useState } from 'react';
import { FormModal } from '@/components/form-modal';
import { DetailsModal } from '@/components/details-modal';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    brand: '',
    description: '',
    image_url: '',
    category_id: '',
    price_kobo: '',
    requires_prescription: false,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch products:', response.status);
        setProducts([]);
        return;
      }
      
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (kobo: number) => {
    return `₦${(kobo / 100).toLocaleString()}`;
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || '-';
  };

  // Filter and paginate products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = search === '' || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
      product.brand?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || product.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'product');

      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        alert(error.error || 'Failed to upload image');
        return;
      }

      const uploadData = await uploadResponse.json();
      setFormData({ ...formData, image_url: uploadData.url });
      setImagePreview(uploadData.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price_kobo: parseInt(formData.price_kobo) * 100,
        }),
      });
      if (response.ok) {
        setCreateModalOpen(false);
        setFormData({
          name: '',
          generic_name: '',
          brand: '',
          description: '',
          image_url: '',
          category_id: '',
          price_kobo: '',
          requires_prescription: false,
        });
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price_kobo: parseInt(formData.price_kobo) * 100,
        }),
      });
      if (response.ok) {
        setEditModalOpen(false);
        setSelectedProduct(null);
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const openEditModal = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      generic_name: product.generic_name || '',
      brand: product.brand || '',
      description: product.description || '',
      image_url: product.image_url || '',
      category_id: product.category_id || '',
      price_kobo: (product.price_kobo / 100).toString(),
      requires_prescription: product.requires_prescription || false,
    });
    setImagePreview(product.image_url || null);
    setEditModalOpen(true);
  };

  const openDetailsModal = (product: any) => {
    setSelectedProduct(product);
    setDetailsModalOpen(true);
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading products...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
            Products
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Manage your pharmacy product catalog
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
          Add Product
        </button>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
        className="page-filters"
      >
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
            minWidth: 150,
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Card View */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paginatedProducts.map((product) => (
            <div
              key={product.id}
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
                    {product.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {getCategoryName(product.category_id)}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: product.is_active ? 'var(--accent-soft)' : 'rgba(239, 68, 68, 0.1)',
                    color: product.is_active ? 'var(--accent)' : '#ef4444',
                  }}
                >
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Price</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {formatCurrency(product.price_kobo)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Stock</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {product.stock_quantity || 0}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openDetailsModal(product)}
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
                  onClick={() => openEditModal(product)}
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
                    Category
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Price
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Stock
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
                {paginatedProducts.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                      {product.name}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                      {getCategoryName(product.category_id)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                      {formatCurrency(product.price_kobo)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                      {product.stock_quantity || 0}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          background: product.is_active ? 'var(--accent-soft)' : 'rgba(239, 68, 68, 0.1)',
                          color: product.is_active ? 'var(--accent)' : '#ef4444',
                        }}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openDetailsModal(product)}
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
                          onClick={() => openEditModal(product)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
          }}
        >
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: currentPage === 1 ? 'var(--surface-2)' : 'var(--surface)',
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text)',
                fontWeight: 600,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              Previous
            </button>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: currentPage === pageNum ? 'var(--brand)' : 'var(--surface)',
                      color: currentPage === pageNum ? 'white' : 'var(--text)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: currentPage === totalPages ? 'var(--surface-2)' : 'var(--surface)',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text)',
                fontWeight: 600,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      <FormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Product"
        size="lg"
      >
        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              Generic Name
            </label>
            <input
              type="text"
              value={formData.generic_name}
              onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
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
              Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
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
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
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
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Price (₦) *
            </label>
            <input
              type="number"
              value={formData.price_kobo}
              onChange={(e) => setFormData({ ...formData, price_kobo: e.target.value })}
              required
              min="0"
              step="0.01"
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
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Product Image
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {imagePreview || formData.image_url ? (
                <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Product preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, image_url: '' });
                      setImagePreview(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div style={{ width: '100%', height: 200, borderRadius: 8, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 14 }}>No image selected</div>
                  </div>
                </div>
              )}
              <input
                type="file"
                id="product-image-upload"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="product-image-upload"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  display: 'inline-block',
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                JPEG, PNG, WebP, or GIF (max 5MB)
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="requires-prescription"
              checked={formData.requires_prescription}
              onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
              style={{
                width: 16,
                height: 16,
                cursor: 'pointer',
              }}
            />
            <label htmlFor="requires-prescription" style={{ fontSize: 14, color: 'var(--text)', cursor: 'pointer' }}>
              Requires Prescription
            </label>
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
              Create Product
            </button>
          </div>
        </form>
      </FormModal>

      {/* Edit Product Modal */}
      <FormModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProduct(null);
          setFormData({
            name: '',
            generic_name: '',
            brand: '',
            description: '',
            image_url: '',
            category_id: '',
            price_kobo: '',
            requires_prescription: false,
          });
          setImagePreview(null);
        }}
        title="Edit Product"
        size="md"
      >
        <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              Generic Name
            </label>
            <input
              type="text"
              value={formData.generic_name}
              onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
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
              Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
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
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
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
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Price (₦) *
            </label>
            <input
              type="number"
              value={formData.price_kobo}
              onChange={(e) => setFormData({ ...formData, price_kobo: e.target.value })}
              required
              min="0"
              step="0.01"
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
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Product Image
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {imagePreview || formData.image_url ? (
                <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Product preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, image_url: '' });
                      setImagePreview(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div style={{ width: '100%', height: 200, borderRadius: 8, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 14 }}>No image selected</div>
                  </div>
                </div>
              )}
              <input
                type="file"
                id="edit-product-image-upload"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="edit-product-image-upload"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  display: 'inline-block',
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                JPEG, PNG, WebP, or GIF (max 5MB)
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="edit_requires_prescription"
              checked={formData.requires_prescription}
              onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="edit_requires_prescription" style={{ fontSize: 14, color: 'var(--text)' }}>
              Requires Prescription
            </label>
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
            Update Product
          </button>
        </form>
      </FormModal>

      {/* Product Details Modal */}
      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedProduct(null);
        }}
        title="Product Details"
        size="md"
      >
        {selectedProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Product Name
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedProduct.name}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Generic Name
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedProduct.generic_name || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Brand
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedProduct.brand || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Category
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{getCategoryName(selectedProduct.category_id)}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Price
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{formatCurrency(selectedProduct.price_kobo)}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Stock Quantity
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedProduct.stock_quantity || 0}</div>
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
                    background: selectedProduct.is_active ? 'var(--accent-soft)' : 'rgba(239, 68, 68, 0.1)',
                    color: selectedProduct.is_active ? 'var(--accent)' : '#ef4444',
                  }}
                >
                  {selectedProduct.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Requires Prescription
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>
                  {selectedProduct.requires_prescription ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
            {selectedProduct.description && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Description
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedProduct.description}</div>
              </div>
            )}
            {selectedProduct.image_url && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Product Image
                </label>
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  style={{ width: '100%', maxWidth: 200, borderRadius: 8, objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
        )}
      </DetailsModal>
    </div>
  );
}
