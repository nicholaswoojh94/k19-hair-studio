'use client'
import { useState, useEffect, useRef } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Toast } from '@/components/ui/toast'
import { MenuButton } from '@/app/admin/menu-button'

type Photo = {
  id: string
  url: string
  storage_path: string
  after_image_url: string | null
  after_storage_path: string | null
  caption: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

type UploadMode = 'single' | 'pair'

export default function AdminGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<UploadMode>('single')
  const [caption, setCaption] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState('')

  // Pair upload state
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [beforePreview, setBeforePreview] = useState<string | null>(null)
  const [afterPreview, setAfterPreview] = useState<string | null>(null)
  const beforeFileRef = useRef<HTMLInputElement>(null)
  const afterFileRef  = useRef<HTMLInputElement>(null)
  const singleFileRef = useRef<HTMLInputElement>(null)

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

  function toast(msg: string, type: 'success' | 'error' = 'success') {
    setToastMsg(msg); setToastType(type); setShowToast(true)
  }

  // ── Single upload ──────────────────────────────────────────────────────────
  async function handleSingleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    let ok = 0, fail = 0
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('caption', caption)
        const res = await fetch('/api/admin/gallery/upload', { method: 'POST', body: fd })
        if (res.ok) ok++; else fail++
      } catch { fail++ }
    }
    await fetchPhotos()
    setCaption('')
    setUploading(false)
    if (ok)   toast(`${ok} photo${ok > 1 ? 's' : ''} uploaded successfully.`)
    if (fail) toast(`${fail} photo${fail > 1 ? 's' : ''} failed to upload.`, 'error')
  }

  // ── Pair upload ────────────────────────────────────────────────────────────
  function handlePairFileSelect(slot: 'before' | 'after', file: File | null) {
    if (!file) return
    const url = URL.createObjectURL(file)
    if (slot === 'before') { setBeforeFile(file); setBeforePreview(url) }
    else                   { setAfterFile(file);  setAfterPreview(url)  }
  }

  async function handlePairUpload() {
    if (!beforeFile || !afterFile) {
      toast('Please select both a Before and an After image.', 'error'); return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('before', beforeFile)
      fd.append('after',  afterFile)
      fd.append('caption', caption)
      const res = await fetch('/api/admin/gallery/upload-pair', { method: 'POST', body: fd })
      if (res.ok) {
        await fetchPhotos()
        setBeforeFile(null); setAfterFile(null)
        setBeforePreview(null); setAfterPreview(null)
        setCaption('')
        toast('Before & After pair uploaded successfully.')
      } else {
        const data = await res.json()
        toast(data.error || 'Upload failed.', 'error')
      }
    } catch { toast('Upload failed.', 'error') }
    finally { setUploading(false) }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(photo: Photo) {
    if (!confirm('Delete this photo? This cannot be undone.')) return
    setDeletingId(photo.id)
    try {
      const res = await fetch(`/api/admin/gallery/${photo.id}`, { method: 'DELETE' })
      if (res.ok) { await fetchPhotos(); toast('Photo deleted.') }
    } finally { setDeletingId(null) }
  }

  async function handleToggleActive(photo: Photo) {
    await fetch(`/api/admin/gallery/${photo.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !photo.is_active }),
    })
    await fetchPhotos()
  }

  async function handleSaveCaption(photo: Photo) {
    await fetch(`/api/admin/gallery/${photo.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: editCaption }),
    })
    await fetchPhotos()
    setEditingId(null)
    toast('Caption updated.')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6,
    fontSize: '0.85rem', fontFamily: "'Poppins',sans-serif",
    outline: 'none', background: '#FAFAFA', color: '#1C1C1C',
    boxSizing: 'border-box', transition: 'border-color 0.2s ease',
  }

  const modeTabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
    fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', fontWeight: active ? 600 : 400,
    background: active ? '#C9A96E' : 'transparent',
    color: active ? '#1C1C1C' : 'rgba(0,0,0,0.45)',
    transition: 'all 0.18s ease',
  })

  return (
    <div className="gallery-page" style={{
      padding: '32px 40px', fontFamily: "'Poppins',sans-serif",
      minHeight: '100vh', background: '#F4F4F2',
    }}>
      <style>{`@media (max-width: 1023px) { .gallery-page { padding: 20px 16px !important; } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <MenuButton />
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 4px' }}>Gallery</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
            {photos.filter(p => p.is_active).length} active · {photos.length} total
            {' · '}{photos.filter(p => p.after_image_url).length} before/after pairs
          </p>
        </div>
      </div>

      {/* Upload area */}
      <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: 24, marginBottom: 24 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.05)', borderRadius: 8, padding: 4, marginBottom: 20 }}>
          <button type="button" style={modeTabStyle(uploadMode === 'single')} onClick={() => setUploadMode('single')}>
            Single Photo
          </button>
          <button type="button" style={modeTabStyle(uploadMode === 'pair')} onClick={() => setUploadMode('pair')}>
            Before &amp; After
          </button>
        </div>

        {uploadMode === 'single' ? (
          /* ── Single upload ────────────────────────────────── */
          <div
            style={{
              border: `2px dashed ${dragOver ? '#C9A96E' : 'rgba(0,0,0,0.12)'}`,
              borderRadius: 8, padding: '28px 24px',
              transition: 'border-color 0.2s ease', cursor: 'pointer', textAlign: 'center',
            }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleSingleUpload(e.dataTransfer.files) }}
            onClick={() => singleFileRef.current?.click()}
          >
            <input ref={singleFileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
              style={{ display: 'none' }} onChange={e => handleSingleUpload(e.target.files)} />
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Spinner size={32} color="#C9A96E" />
                <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.5)', margin: 0 }}>Uploading...</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>📸</div>
                <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 4px' }}>
                  {dragOver ? 'Drop photos here' : 'Click or drag photos to upload'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.35)', margin: '0 0 14px' }}>
                  JPG, PNG or WebP · Max 5MB · Multiple files supported
                </p>
              </>
            )}
            {!uploading && (
              <div style={{ maxWidth: 360, margin: '0 auto' }} onClick={e => e.stopPropagation()}>
                <input type="text" placeholder="Caption (optional)" value={caption}
                  onChange={e => setCaption(e.target.value)} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
              </div>
            )}
          </div>
        ) : (
          /* ── Pair upload ──────────────────────────────────── */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {(['before', 'after'] as const).map(slot => {
                const preview = slot === 'before' ? beforePreview : afterPreview
                const ref = slot === 'before' ? beforeFileRef : afterFileRef
                const label = slot === 'before' ? 'Before' : 'After'
                return (
                  <div key={slot}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 6, margin: '0 0 6px' }}>
                      {label} Image
                    </p>
                    <div
                      style={{
                        border: `2px dashed ${preview ? '#C9A96E' : 'rgba(0,0,0,0.12)'}`,
                        borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                        minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: preview ? '#000' : '#FAFAFA', position: 'relative',
                        transition: 'border-color 0.2s ease',
                      }}
                      onClick={() => ref.current?.click()}
                    >
                      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }} onChange={e => handlePairFileSelect(slot, e.target.files?.[0] || null)} />
                      {preview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview} alt={label} style={{ width: '100%', height: 'auto', display: 'block', opacity: 0.85 }} />
                          <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.6)', color: '#FAFAF8', fontSize: '0.6rem', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 3, fontFamily: "'Poppins',sans-serif" }}>
                            {label} · Click to change
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px 12px' }}>
                          <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{slot === 'before' ? '🖼️' : '✨'}</div>
                          <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>Click to select {label} image</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginBottom: 12 }}>
              <input type="text" placeholder="Caption (optional)" value={caption}
                onChange={e => setCaption(e.target.value)} style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>

            <button
              type="button"
              onClick={handlePairUpload}
              disabled={uploading || !beforeFile || !afterFile}
              style={{
                width: '100%', padding: '11px', border: 'none', borderRadius: 6, cursor: uploading || !beforeFile || !afterFile ? 'not-allowed' : 'pointer',
                background: beforeFile && afterFile ? '#C9A96E' : 'rgba(0,0,0,0.08)',
                color: beforeFile && afterFile ? '#1C1C1C' : 'rgba(0,0,0,0.35)',
                fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem', fontWeight: 600,
                transition: 'all 0.18s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {uploading ? <><Spinner size={16} color="#1C1C1C" /> Uploading...</> : 'Upload Before & After Pair'}
            </button>
          </div>
        )}
      </div>

      {/* Photos grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}><Spinner size={32} color="#C9A96E" /></div>
      ) : photos.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '64px', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 12px' }}>🖼️</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 4px' }}>No photos yet</p>
          <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.35)', margin: 0 }}>Upload photos above to populate the gallery on the homepage.</p>
        </div>
      ) : (
        <div style={{ columns: '4 200px', columnGap: '16px' }}>
          {photos.map(photo => (
            <div key={photo.id} style={{
              breakInside: 'avoid', marginBottom: '16px', background: '#FFFFFF',
              borderRadius: 8, overflow: 'hidden',
              border: `1px solid ${photo.after_image_url ? 'rgba(201,169,110,0.35)' : 'rgba(0,0,0,0.06)'}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              opacity: photo.is_active ? 1 : 0.5, transition: 'opacity 0.2s ease',
            }}>
              {/* Image preview */}
              <div style={{ position: 'relative' }}>
                {photo.after_image_url ? (
                  /* Before/After pair: show both side by side */
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="Before" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#FAFAF8', fontSize: '0.55rem', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '1px 5px', borderRadius: 2, fontFamily: "'Poppins',sans-serif" }}>Before</div>
                    </div>
                    <div style={{ width: 1, background: '#C9A96E', opacity: 0.5 }} />
                    <div style={{ flex: 1, position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.after_image_url} alt="After" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(201,169,110,0.85)', color: '#1C1C1C', fontSize: '0.55rem', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '1px 5px', borderRadius: 2, fontFamily: "'Poppins',sans-serif" }}>After</div>
                    </div>
                  </div>
                ) : (
                  /* Single photo */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.url} alt={photo.caption || 'Gallery photo'} style={{ width: '100%', height: 'auto', display: 'block' }} />
                )}
                {!photo.is_active && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600 }}>HIDDEN</span>
                  </div>
                )}
              </div>

              {/* Type badge */}
              {photo.after_image_url && (
                <div style={{ padding: '5px 10px', background: 'rgba(201,169,110,0.08)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#C9A96E', fontFamily: "'Poppins',sans-serif" }}>
                    Before &amp; After
                  </span>
                </div>
              )}

              <div style={{ padding: '10px 12px' }}>
                {editingId === photo.id ? (
                  <div style={{ marginBottom: 8 }}>
                    <input type="text" value={editCaption} onChange={e => setEditCaption(e.target.value)}
                      style={{ ...inputStyle, fontSize: '0.75rem', padding: '6px 10px', marginBottom: 6 }} autoFocus
                      onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={() => handleSaveCaption(photo)}
                        style={{ flex: 1, padding: '5px', background: '#C9A96E', border: 'none', borderRadius: 4, color: '#1C1C1C', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}
                        style={{ flex: 1, padding: '5px', background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 4, color: 'rgba(0,0,0,0.5)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.4)', margin: '0 0 8px', cursor: 'pointer', minHeight: 16 }}
                    onClick={() => { setEditingId(photo.id); setEditCaption(photo.caption || '') }} title="Click to edit caption">
                    {photo.caption || <span style={{ color: 'rgba(0,0,0,0.2)', fontStyle: 'italic' }}>Click to add caption</span>}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => handleToggleActive(photo)}
                    style={{ flex: 1, padding: '5px', background: 'transparent', border: `1px solid ${photo.is_active ? 'rgba(0,0,0,0.12)' : '#4CAF50'}`, borderRadius: 4, color: photo.is_active ? 'rgba(0,0,0,0.45)' : '#4CAF50', fontSize: '0.68rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>
                    {photo.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" onClick={() => handleDelete(photo)} disabled={deletingId === photo.id}
                    style={{ flex: 1, padding: '5px', background: 'transparent', border: '1px solid rgba(229,115,115,0.3)', borderRadius: 4, color: '#E57373', fontSize: '0.68rem', fontWeight: 500, cursor: deletingId === photo.id ? 'not-allowed' : 'pointer', fontFamily: "'Poppins',sans-serif" }}>
                    {deletingId === photo.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast message={toastMsg} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  )
}
