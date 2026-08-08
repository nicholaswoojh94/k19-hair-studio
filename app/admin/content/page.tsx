'use client'
import { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapLink from '@tiptap/extension-link'
import { Spinner } from '@/components/ui/spinner'
import { Toast } from '@/components/ui/toast'
import { MenuButton } from '@/app/admin/menu-button'

const PAGE_KEY = 'privacy_policy'

const btnBase: React.CSSProperties = {
  padding: '5px 10px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 4,
  background: 'transparent', cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
  fontSize: '0.75rem', fontWeight: 500, color: '#1C1C1C',
  transition: 'all 0.15s ease', lineHeight: 1,
}

const btnActive: React.CSSProperties = {
  ...btnBase, background: '#C9A96E', borderColor: '#C9A96E', color: '#1C1C1C',
}

function ToolbarBtn({
  label, active, onClick, title,
}: { label: React.ReactNode; active?: boolean; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      style={active ? btnActive : btnBase}
      title={title}
      onMouseOver={e => { if (!active) { e.currentTarget.style.background = 'rgba(201,169,110,0.12)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)' } }}
      onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)' } }}
    >
      {label}
    </button>
  )
}

export default function AdminContentPage() {
  const [title, setTitle] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [contentReady, setContentReady] = useState(false)
  const [initialContent, setInitialContent] = useState('')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
    ],
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  })

  const fetchPage = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/site-pages/${PAGE_KEY}`)
      if (res.ok) {
        const data = await res.json()
        setTitle(data.title || 'Privacy Policy')
        setUpdatedAt(data.updated_at || null)
        setInitialContent(data.content || '')
        setContentReady(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPage() }, [fetchPage])

  useEffect(() => {
    if (editor && contentReady && initialContent) {
      editor.commands.setContent(initialContent)
    }
  }, [editor, contentReady, initialContent])

  async function handleSave() {
    if (!editor) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/site-pages/${PAGE_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: editor.getHTML() }),
      })
      const data = await res.json()
      if (res.ok) {
        setUpdatedAt(data.page?.updated_at || new Date().toISOString())
        setToastMsg('Privacy policy saved.')
        setToastType('success')
      } else {
        setToastMsg(data.error || 'Failed to save.')
        setToastType('error')
      }
      setShowToast(true)
    } finally {
      setSaving(false)
    }
  }

  function handleSetLink() {
    if (!editor) return
    const prev = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', prev || 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="content-page" style={{ padding: '32px 40px', fontFamily: "'Poppins',sans-serif", minHeight: '100vh', background: '#F4F4F2' }}>
      <style>{`
        @media (max-width: 1023px) {
          .content-page { padding: 20px 16px !important; }
        }
        .tiptap-editor {
          min-height: 480px;
          outline: none;
          font-family: 'Poppins', sans-serif;
          font-size: 0.88rem;
          line-height: 1.8;
          color: #1C1C1C;
        }
        .tiptap-editor h2 {
          font-family: 'Lora', Georgia, serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1C1C1C;
          margin: 1.5em 0 0.5em;
        }
        .tiptap-editor h3 {
          font-family: 'Lora', Georgia, serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1C1C1C;
          margin: 1.25em 0 0.4em;
        }
        .tiptap-editor p { margin: 0 0 0.75em; }
        .tiptap-editor ul, .tiptap-editor ol { padding-left: 1.5em; margin: 0 0 0.75em; }
        .tiptap-editor li { margin-bottom: 0.25em; }
        .tiptap-editor a { color: #C9A96E; text-decoration: underline; }
        .tiptap-editor strong { font-weight: 600; }
        .tiptap-editor em { font-style: italic; }
        .tiptap-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: rgba(0,0,0,0.25);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <MenuButton />
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 4px' }}>Website Content</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>Edit legal pages displayed on the public website.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <Spinner size={24} color="#C9A96E" />
        </div>
      ) : (
        <div style={{ maxWidth: 800 }}>

          {/* Section card */}
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 20 }}>

            {/* Section label */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                Privacy Policy
              </p>
              {updatedAt && (
                <span style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.3)', fontFamily: "'Poppins',sans-serif" }}>
                  Last saved {new Date(updatedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Title field */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                Page Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6, fontSize: '0.85rem', fontFamily: "'Poppins',sans-serif", outline: 'none', background: '#FAFAFA', color: '#1C1C1C', boxSizing: 'border-box', transition: 'border-color 0.2s ease' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
              />
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px', background: '#F8F8F6', border: '1.5px solid rgba(0,0,0,0.1)', borderBottom: 'none', borderRadius: '6px 6px 0 0', alignItems: 'center' }}>
              <ToolbarBtn
                label={<strong>B</strong>}
                title="Bold"
                active={editor?.isActive('bold')}
                onClick={() => editor?.chain().focus().toggleBold().run()}
              />
              <ToolbarBtn
                label={<em>I</em>}
                title="Italic"
                active={editor?.isActive('italic')}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              />
              <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />
              <ToolbarBtn
                label="H2"
                title="Heading 2"
                active={editor?.isActive('heading', { level: 2 })}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              />
              <ToolbarBtn
                label="H3"
                title="Heading 3"
                active={editor?.isActive('heading', { level: 3 })}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              />
              <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />
              <ToolbarBtn
                label={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                }
                title="Bullet List"
                active={editor?.isActive('bulletList')}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              />
              <ToolbarBtn
                label={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
                    <path d="M4 6h1v4"/><path d="M4 10H6"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
                  </svg>
                }
                title="Numbered List"
                active={editor?.isActive('orderedList')}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              />
              <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />
              <ToolbarBtn
                label={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                }
                title="Set Link"
                active={editor?.isActive('link')}
                onClick={handleSetLink}
              />
            </div>

            {/* Editor area */}
            <div style={{ border: '1.5px solid rgba(0,0,0,0.1)', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '16px 20px', background: '#FFFFFF', minHeight: 480 }}>
              <EditorContent editor={editor} />
            </div>

          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !editor}
            style={{
              padding: '10px 28px', background: saving ? 'rgba(201,169,110,0.4)' : '#C9A96E',
              border: 'none', borderRadius: 6, color: '#1C1C1C',
              fontSize: '0.82rem', fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'Poppins',sans-serif",
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {saving ? <><Spinner size={14} color="#1C1C1C" /> Saving...</> : 'Save Privacy Policy'}
          </button>

        </div>
      )}

      <Toast message={toastMsg} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  )
}
