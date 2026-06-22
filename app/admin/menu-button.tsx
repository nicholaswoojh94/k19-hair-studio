'use client'

export function MenuButton() {
  return (
    <button
      type="button"
      className="admin-hamburger-btn"
      onClick={() => window.dispatchEvent(new Event('k19:sidebar-open'))}
      aria-label="Open navigation"
      style={{
        display: 'none', // CSS overrides to flex on mobile via layout's <style>
        flexShrink: 0,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        color: '#1C1C1C',
        padding: 0,
        transition: 'background 0.15s ease',
      }}
      onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  )
}
