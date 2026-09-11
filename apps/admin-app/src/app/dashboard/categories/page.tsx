'use client';

import { useEffect, useState } from 'react';
import { FormModal } from '@/components/form-modal';
import { DetailsModal } from '@/components/details-modal';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    is_active: true,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
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
      
      if (!response.ok) {
        console.error('Failed to fetch categories:', response.status);
        setCategories([]);
        return;
      }
      
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'category');

      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        toast.error(error.error || 'Failed to upload image');
        return;
      }

      const uploadData = await uploadResponse.json();
      setFormData({ ...formData, image_url: uploadData.url });
      setImagePreview(uploadData.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setCreateModalOpen(false);
        setFormData({
          name: '',
          description: '',
          image_url: '',
          is_active: true,
        });
        setImagePreview(null);
        fetchCategories();
        toast.success('Category created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error('Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditModalOpen(false);
        setSelectedCategory(null);
        setFormData({
          name: '',
          description: '',
          image_url: '',
          is_active: true,
        });
        setImagePreview(null);
        fetchCategories();
        toast.success('Category updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error('Failed to update category');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    setDeleting(id);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchCategories();
        toast.success('Category deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
    } finally {
      setDeleting(null);
    }
  };

  const openEditModal = (category: any) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: category.is_active ?? true,
    });
    setImagePreview(category.image_url || null);
    setEditModalOpen(true);
  };

  const openDetailsModal = (category: any) => {
    setSelectedCategory(category);
    setDetailsModalOpen(true);
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading categories...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Categories
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Manage product categories
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
          Add Category
        </button>
      </div>

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {categories.map((category) => (
            <div
              key={category.id}
              style={{
                padding: 16,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: 'var(--surface-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    📦
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    {category.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {category.slug || 'No slug'}
                  </div>
                </div>
                <div
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: category.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: category.is_active ? '#22c55e' : '#ef4444',
                  }}
                >
                  {category.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openDetailsModal(category)}
                  style={{
                    flex: 1,
                    padding: '8px',
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
                  onClick={() => openEditModal(category)}
                  style={{
                    flex: 1,
                    padding: '8px',
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
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  disabled={deleting === category.id}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: '1px solid #ef4444',
                    background: deleting === category.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: deleting === category.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deleting === category.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface-2)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-3)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Image
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Name
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          background: 'var(--surface-3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                        }}
                      >
                        📦
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text)' }}>
                    {category.name}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: category.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: category.is_active ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openDetailsModal(category)}
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
                        onClick={() => openEditModal(category)}
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
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={deleting === category.id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid #ef4444',
                          background: deleting === category.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: deleting === category.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {deleting === category.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Category Modal */}
      <FormModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setFormData({
            name: '',
            description: '',
            image_url: '',
            is_active: true,
          });
          setImagePreview(null);
        }}
        title="Add New Category"
        size="md"
      >
        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
              }}
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
              Category Image
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {imagePreview || formData.image_url ? (
                <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Category preview"
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
                id="category-image-upload"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="category-image-upload"
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
              id="is-active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="is-active" style={{ fontSize: 14, color: 'var(--text)', cursor: 'pointer' }}>
              Active
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              disabled={creating}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontWeight: 600,
                cursor: creating ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: creating ? 'var(--border)' : 'var(--brand)',
                color: 'white',
                fontWeight: 600,
                cursor: creating ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              {creating ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Edit Category Modal */}
      <FormModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCategory(null);
          setFormData({
            name: '',
            description: '',
            image_url: '',
            is_active: true,
          });
          setImagePreview(null);
        }}
        title="Edit Category"
        size="md"
      >
        <form onSubmit={handleUpdateCategory} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Category Name *
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
              Category Image
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {imagePreview || formData.image_url ? (
                <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Category preview"
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
                id="edit-category-image-upload"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="edit-category-image-upload"
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
              id="edit-is-active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="edit-is-active" style={{ fontSize: 14, color: 'var(--text)' }}>
              Active
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              disabled={updating}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontWeight: 600,
                cursor: updating ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: updating ? 'var(--border)' : 'var(--brand)',
                color: 'white',
                fontWeight: 600,
                cursor: updating ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              {updating ? 'Updating...' : 'Update Category'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Category Details Modal */}
      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedCategory(null);
        }}
        title="Category Details"
        size="md"
      >
        {selectedCategory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedCategory.image_url && (
              <div style={{ width: '100%', height: 200, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img
                  src={selectedCategory.image_url}
                  alt={selectedCategory.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Name
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedCategory.name}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Slug
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedCategory.slug || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Status
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>
                  {selectedCategory.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            {selectedCategory.description && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Description
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                  {selectedCategory.description}
                </div>
              </div>
            )}
          </div>
        )}
      </DetailsModal>
    </div>
  );
}
