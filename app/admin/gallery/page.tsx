'use client'
import { useState, useEffect, useRef } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Toast } from '@/components/ui/toast'

type Photo = {
  id: string
  url: string
  caption: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export default function AdminGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchPhotos() }, [])

  async function fetchPhotos() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/gallery')
      const data = await res.json()
      setPhotos(data.photos || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    let successCount = 0
    let errorCount = 0

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('caption', caption)

        const res = await fetch('/api/admin/gallery/upload', {
          method: 'POST',
          body: formData,
        })

        if (res.ok) {
          successCount++
        } else {
          const data = await res.json()
          console.error('Upload error:', data.error)
          errorCount++
        }
      } catch (err) {
        errorCount++
      }
    }

    await fetchPhotos()
    setCaption('')
    setUploading(false)

    if (successCount > 0) {
      setToastMsg(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded successfully.`)
      setToastType('success')
      setShowToast(true)
    }
    if (errorCount > 0) {
      setToastMsg(`${errorCount} photo${errorCount > 1 ? 's' : ''} failed to upload.`)
      setToastType('error')
      setShowToast(true)
    }
  }

  async function handleDelete(photo: Photo) {
    if (!confirm(`Delete this photo? This cannot be undone.`)) return
    setDeletingId(photo.id)
    try {
      const res = await fetch(`/api/admin/gallery/${photo.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchPhotos()
        setToastMsg('Photo deleted.')
        setToastType('success')
        setShowToast(true)
      }
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleActive(photo: Photo) {
    await fetch(`/api/admin/gallery/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !photo.is_active }),
    })
    await fetchPhotos()
  }

  async function handleSaveCaption(photo: Photo) {
    await fetch(`/api/admin/gallery/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: editCaption }),
    })
    await fetchPhotos()
    setEditingId(null)
    setToastMsg('Caption updated.')
    setToastType('success')
    setShowToast(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid rgba(0,0,0,0.12)',
    borderRadius: 6,
    fontSize: '0.85rem',
    fontFamily: "'Poppins',sans-serif",
    outline: 'none',
    background: '#FAFAFA',
    color: '#1C1C1C',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  }

  return (
    <div style={{
      padding: '32px 40px',
      fontFamily: "'Poppins',sans-serif",
      minHeight: '100vh',
      background: '#F4F4F2',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 4px' }}>
          Gallery
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
          {photos.filter(p => p.is_active).length} active photos · {photos.length} total
        </p>
      </div>

      {/* Upload area */}
      <div
        style={{
          background: '#FFFFFF',
          border: `2px dashed ${dragOver ? '#C9A96E' : 'rgba(0,0,0,0.12)'}`,
          borderRadius: 10,
          padding: '32px',
          marginBottom: 24,
          transition: 'border-color 0.2s ease',
          cursor: 'pointer',
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          handleUpload(e.dataTransfer.files)
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)}
        />
        <div style={{ textAlign: 'center' }}>
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Spinner size={32} color="#C9A96E" />
              <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.5)', margin: 0 }}>
                Uploading photos...
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📸</div>
              <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 4px' }}>
                {dragOver ? 'Drop photos here' : 'Click or drag photos to upload'}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.35)', margin: '0 0 16px' }}>
                JPG, PNG or WebP · Max 5MB each · Multiple files supported
              </p>
            </>
          )}
        </div>

        {!uploading && (
          <div
            style={{ maxWidth: 400, margin: '0 auto' }}
            onClick={e => e.stopPropagation()}
          >
            <input
              type="text"
              placeholder="Caption for uploaded photos (optional)"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
            />
          </div>
        )}
      </div>

      {/* Photos grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Spinner size={32} color="#C9A96E" />
        </div>
      ) : photos.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 10,
          padding: '64px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 12px' }}>🖼️</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 4px' }}>
            No photos yet
          </p>
          <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.35)', margin: 0 }}>
            Upload photos above to populate the gallery on the homepage.
          </p>
        </div>
      ) : (
        <div style={{ columns: '4 200px', columnGap: '16px' }}>
          {photos.map(photo => (
            <div key={photo.id} style={{
              breakInside: 'avoid',
              marginBottom: '16px',
              background: '#FFFFFF',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              opacity: photo.is_active ? 1 : 0.5,
              transition: 'opacity 0.2s ease',
            }}>
              <div style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption || 'Gallery photo'}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                {!photo.is_active && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600 }}>
                      HIDDEN
                    </span>
                  </div>
                )}
              </div>

              <div style={{ padding: '10px 12px' }}>
                {editingId === photo.id ? (
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="text"
                      value={editCaption}
                      onChange={e => setEditCaption(e.target.value)}
                      style={{ ...inputStyle, fontSize: '0.75rem', padding: '6px 10px', marginBottom: 6 }}
                      autoFocus
                      onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleSaveCaption(photo)}
                        style={{ flex: 1, padding: '5px', background: '#C9A96E', border: 'none', borderRadius: 4, color: '#1C1C1C', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        style={{ flex: 1, padding: '5px', background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 4, color: 'rgba(0,0,0,0.5)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.4)', margin: '0 0 8px', cursor: 'pointer', minHeight: 16 }}
                    onClick={() => { setEditingId(photo.id); setEditCaption(photo.caption || '') }}
                    title="Click to edit caption"
                  >
                    {photo.caption || (
                      <span style={{ color: 'rgba(0,0,0,0.2)', fontStyle: 'italic' }}>
                        Click to add caption
                      </span>
                    )}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(photo)}
                    style={{
                      flex: 1,
                      padding: '5px',
                      background: 'transparent',
                      border: `1px solid ${photo.is_active ? 'rgba(0,0,0,0.12)' : '#4CAF50'}`,
                      borderRadius: 4,
                      color: photo.is_active ? 'rgba(0,0,0,0.45)' : '#4CAF50',
                      fontSize: '0.68rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: "'Poppins',sans-serif",
                    }}
                  >
                    {photo.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo)}
                    disabled={deletingId === photo.id}
                    style={{
                      flex: 1,
                      padding: '5px',
                      background: 'transparent',
                      border: '1px solid rgba(229,115,115,0.3)',
                      borderRadius: 4,
                      color: '#E57373',
                      fontSize: '0.68rem',
                      fontWeight: 500,
                      cursor: deletingId === photo.id ? 'not-allowed' : 'pointer',
                      fontFamily: "'Poppins',sans-serif",
                    }}
                  >
                    {deletingId === photo.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast
        message={toastMsg}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
