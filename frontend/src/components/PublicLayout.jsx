import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

/**
 * PublicLayout — used by all pre-login pages (Home, Register, Login, etc.)
 * Uses shared SiteHeader (right side = portal badge) and SiteFooter.
 * Has its own public navbar: Home | Search College | EN मराठी | New Registration | Log In
 */
export default function PublicLayout({ children }) {
  const [langActive, setLangActive] = useState(() => {
    try { return localStorage.getItem('mpkv_lang') || 'en' } catch { return 'en' }
  })

  // Restore saved language on mount — same as index.html DOMContentLoaded handler
  useEffect(() => {
    if (langActive === 'mr') {
      setTimeout(() => {
        const s = document.querySelector('.goog-te-combo')
        if (s) { s.value = 'mr'; s.dispatchEvent(new Event('change')) }
      }, 800)
    }
  }, [])

  const navLinks = [
    { to: '/',               label: 'Home'           },
    { to: '/search-college', label: 'Search College' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">

      {/* Shared university header — not logged in → shows portal badge + admission text */}
      <SiteHeader />

      {/* Public navbar — Home | Search College | EN मराठी | New Registration | Log In */}
      <nav style={{ backgroundColor: '#14212e', padding: '5px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 40 }}>
        <ul style={{ display: 'flex', flexDirection: 'row', listStyle: 'none', margin: 0, padding: 0 }}>
          {navLinks.map(link => (
            <li key={link.to}>
              <Link to={link.to}
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ffffff', textDecoration: 'none', fontSize: 16, fontWeight: 500, padding: '10px 16px', whiteSpace: 'nowrap', border: '1.5px solid transparent', borderRadius: 6, transition: 'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = '#1fa876' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Language toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: 3 }}>
            <button onClick={() => { setLangActive('en'); window.setLang && window.setLang('en') }}
              style={{ background: langActive==='en'?'#059669':'transparent', border:'none', color: langActive==='en'?'#fff':'rgba(255,255,255,0.75)', fontSize:13, fontWeight:600, padding:'5px 11px', borderRadius:4, cursor:'pointer', fontFamily:'inherit' }}>EN</button>
            <button onClick={() => { setLangActive('mr'); window.setLang && window.setLang('mr') }}
              style={{ background: langActive==='mr'?'#059669':'transparent', border:'none', color: langActive==='mr'?'#fff':'rgba(255,255,255,0.75)', fontSize:13, fontWeight:600, padding:'5px 11px', borderRadius:4, cursor:'pointer', fontFamily:'inherit' }}>मराठी</button>
          </div>

          {/* New Registration */}
          <Link to="/register"
            style={{ display:'flex', alignItems:'center', gap:8, backgroundColor:'#1fa876', color:'#ffffff', border:'none', padding:'10px 18px', borderRadius:6, fontSize:14, fontWeight:600, textDecoration:'none', whiteSpace:'nowrap', cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor='#178a5f'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor='#1fa876'}>
            + New Registration
          </Link>

          {/* Log In */}
          <Link to="/login"
            style={{ display:'flex', alignItems:'center', gap:8, backgroundColor:'transparent', color:'#ffffff', border:'1px solid rgba(255,255,255,0.4)', padding:'10px 18px', borderRadius:6, fontSize:14, fontWeight:600, textDecoration:'none', whiteSpace:'nowrap', cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
            Log In →
          </Link>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      {/* Shared footer */}
      <SiteFooter />
    </div>
  )
}
