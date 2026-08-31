import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * SiteHeader — shared university header used by ALL layouts.
 *
 * Left  : MPKV logo + Marathi name + English name + city
 * Right :
 *   - Not logged in  → ADMISSIONS PORTAL badge + website name text
 *   - Logged in (candidate) → candidate photo (clickable → name + Sign Out)
 *   - Logged in (college)   → dummy-user.png (clickable → userID + Sign Out)
 *
 * Props:
 *   onSignOut   (fn)     — called when Sign Out is clicked (each layout handles its own logout flow)
 *   rightSlot   (node)   — optional: override the right side completely (for full custom control)
 */

function resolvePhotoUrl(url) {
  if (!url) return '/dummy-user.png'
  let current = url
  while (current.includes('ViewFile.aspx') && current.includes('FileURL=')) {
    const match = current.match(/FileURL=([^&\s]+)/)
    if (!match?.[1]) break
    const extracted = decodeURIComponent(match[1])
    if (extracted === current) break
    current = extracted
  }
  return current || '/dummy-user.png'
}

export default function SiteHeader({ onSignOut, rightSlot }) {
  const { user, isLoggedIn } = useAuth()
  const isCandidate = user?.userTypeID === 91 || user?.userTypeID === '91'
  const [open, setOpen] = useState(false)
  const ref  = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Photo to show — candidates have their uploaded photo, others use dummy-user
  const photoSrc = isCandidate && user?.photoPath
    ? resolvePhotoUrl(user.photoPath)
    : '/dummy-user.png'

  // Display name / ID
  const displayName = user?.userName || user?.userLoginID || 'User'
  const displaySub  = isCandidate
    ? user?.userLoginID
    : `College · ${user?.userLoginID ?? ''}`

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 32px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

        {/* ── Left: Logo + University name ────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 82, height: 82, borderRadius: '50%',
            border: '1px solid #e2e8f0',
            boxShadow: '0 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fff', flexShrink: 0, overflow: 'hidden'
          }}>
            <img src="/MPKVLogo.png" alt="MPKV Logo"
              style={{ width: 80, height: 80, objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.3 }}>
              महात्मा फुले कृषि विद्यापीठ, राहुरी, अहिल्यानगर, महाराष्ट्र
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, margin: '2px 0' }}>
              Mahatma Phule Agriculture University
            </div>
            <div style={{ fontSize: 15, color: '#64748b' }}>
              Rahuri, Ahilyanagar, Maharashtra
            </div>
          </div>
        </div>

        {/* ── Right: custom slot OR auto-detect login state ────────────── */}
        {rightSlot
          ? rightSlot
          : !isLoggedIn
            /* ── Not logged in: portal badge + admission text ─────────── */
            ? (
              <div style={{ textAlign: 'right' }} className="hidden md:block">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdfa', color: '#115e59', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 9999, border: '1px solid #ccfbf1' }}>
                  <i className="fas fa-graduation-cap" /> ADMISSIONS PORTAL
                </span>
                <div style={{ fontSize: 14, color: '#334155', maxWidth: 300, textAlign: 'right', lineHeight: 1.5, marginTop: 6 }}>
                  Online Agriculture Diploma / Polytechnic /<br />Mali Certificate Admissions - 2026
                </div>
              </div>
            )
            /* ── Logged in: circular profile image + dropdown ─────────── */
            : (
              <div ref={ref} style={{ position: 'relative' }}>
                <img
                  src={photoSrc}
                  alt="Profile"
                  onClick={() => setOpen(o => !o)}
                  style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid #e2e8f0', objectFit: 'cover', cursor: 'pointer', display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  onError={e => { e.currentTarget.src = '/dummy-user.png' }}
                />

                {open && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 9999,
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    minWidth: 210, overflow: 'hidden'
                  }}>
                    {/* User info */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>
                        Logged in as
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{displayName}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{displaySub}</div>
                    </div>
                    {/* Sign Out */}
                    {onSignOut && (
                      <button
                        onClick={() => { setOpen(false); onSignOut() }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#ef4444', fontWeight: 600, textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <i className="fas fa-sign-out-alt" style={{ fontSize: 13 }}/> Sign Out
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
        }

      </div>
    </header>
  )
}
