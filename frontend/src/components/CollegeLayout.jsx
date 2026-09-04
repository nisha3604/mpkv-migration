import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { menuApi } from '../services/api'
import { mapUrl, isGroupItem } from '../utils/menuUrlMap'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'
export default function CollegeLayout({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const navRef     = useRef(null)
  const [showLogout,  setShowLogout]  = useState(false)
  const [menuItems,   setMenuItems]   = useState([])
  const [openDrop,    setOpenDrop]    = useState(null)
  const [langActive,  setLangActive]  = useState(() => {
    try { return localStorage.getItem('mpkv_lang') || 'en' } catch { return 'en' }
  })

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }
  const dashPath = isAdmin ? '/admin/dashboard' : '/college/dashboard'

  // Load DB-driven menu
  useEffect(() => {
    menuApi.getMenu(langActive)
      .then(res => { if (res.data.success) setMenuItems(res.data.items ?? []) })
      .catch(() => {})
  }, [langActive])

  // Close on outside click
  useEffect(() => {
    const h = e => { if (navRef.current && !navRef.current.contains(e.target)) setOpenDrop(null) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const parents    = menuItems.filter(m => m.parentMenuID === 0).sort((a,b) => a.seqNo - b.seqNo)
  const getChildren = (pid) => menuItems.filter(m => m.parentMenuID === pid).sort((a,b) => a.seqNo - b.seqNo)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      {/* Shared university header */}
      <SiteHeader onSignOut={() => setShowLogout(true)} />

      {/* ── Dark Navbar ────────────────────────────────────────────────── */}
      <nav ref={navRef} style={{ backgroundColor: '#14212e', padding: '0 24px', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 40 }}>

        {/* Nav items */}
        <ul style={{ display: 'flex', flexDirection: 'row', listStyle: 'none', margin: 0, padding: 0, flex: 1 }}>
          {/* Dashboard — always first */}
          <li>
            <Link to={dashPath}
              style={{ display:'flex', alignItems:'center', color:'rgba(255,255,255,.85)', textDecoration:'none', fontSize:14, fontWeight:500, padding:'12px 16px', whiteSpace:'nowrap', borderBottom: location.pathname===dashPath?'2px solid #059669':'2px solid transparent' }}
              onMouseEnter={e=>{ e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(255,255,255,.06)' }}
              onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,.85)'; e.currentTarget.style.background='transparent' }}>
              Dashboard
            </Link>
          </li>

          {/* Dynamic menu items */}
          {parents.map(item => {
            const kids   = getChildren(item.menuID)
            const isOpen = openDrop === item.menuID
            const url    = mapUrl(item.linkURL)
            const isGrp  = isGroupItem(item.linkURL) || kids.length > 0
            const isAct  = !isGrp && location.pathname === url

            return (
              <li key={item.menuID} style={{ position:'relative' }}>
                {isGrp ? (
                  <button onClick={() => setOpenDrop(isOpen ? null : item.menuID)}
                    style={{ display:'flex', alignItems:'center', gap:6, color:isOpen?'#fff':'rgba(255,255,255,.75)', background:'transparent', border:'none', fontSize:14, fontWeight:500, padding:'12px 16px', whiteSpace:'nowrap', cursor:'pointer', fontFamily:'inherit', borderBottom:isOpen?'2px solid #059669':'2px solid transparent' }}
                    onMouseEnter={e=>{ if(!isOpen){ e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(255,255,255,.06)' }}}
                    onMouseLeave={e=>{ if(!isOpen){ e.currentTarget.style.color='rgba(255,255,255,.75)'; e.currentTarget.style.background='transparent' }}}>
                    {item.linkName}
                    <i className={`fas fa-chevron-down`} style={{ fontSize:10, transition:'transform .2s', transform:isOpen?'rotate(180deg)':'rotate(0deg)' }}/>
                  </button>
                ) : (
                  <Link to={url} target={item.target||'_self'}
                    style={{ display:'flex', alignItems:'center', color:isAct?'#fff':'rgba(255,255,255,.75)', textDecoration:'none', fontSize:14, fontWeight:isAct?600:500, padding:'12px 16px', whiteSpace:'nowrap', borderBottom:isAct?'2px solid #059669':'2px solid transparent' }}
                    onMouseEnter={e=>{ if(!isAct){ e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(255,255,255,.06)' }}}
                    onMouseLeave={e=>{ if(!isAct){ e.currentTarget.style.color='rgba(255,255,255,.75)'; e.currentTarget.style.background='transparent' }}}>
                    {item.linkName}
                  </Link>
                )}

                {/* Dropdown panel */}
                {isOpen && kids.length > 0 && (
                  <div style={{ position:'absolute', top:'100%', left:0, zIndex:9999, background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.14)', minWidth:240, padding:'6px 0' }}>
                    {kids.map(child => {
                      const childUrl = mapUrl(child.linkURL)
                      const cAct     = location.pathname === childUrl
                      return (
                        <button key={child.menuID}
                          onClick={() => { navigate(childUrl === '#' ? dashPath : childUrl); setOpenDrop(null) }}
                          style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 16px', background:cAct?'#f0fdf4':'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, color:cAct?'#059669':'#1e293b', fontWeight:cAct?600:400 }}
                          onMouseEnter={e=>{ if(!cAct){ e.currentTarget.style.background='#f0fdf9'; e.currentTarget.style.color='#059669' }}}
                          onMouseLeave={e=>{ if(!cAct){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#1e293b' }}}>
                          {child.isNew && <span style={{ background:'#ef4444', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3, marginRight:6 }}>NEW</span>}
                          {child.linkName}
                        </button>
                      )
                    })}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {/* Right: language toggle + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: 3 }}>
            {[['en','EN'],['mr','मराठी']].map(([code,label]) => (
              <button key={code} onClick={() => { setLangActive(code); window.setLang && window.setLang(code) }}
                style={{ background:langActive===code?'#059669':'transparent', border:'none', color:langActive===code?'#fff':'rgba(255,255,255,.75)', fontSize:13, fontWeight:600, padding:'5px 11px', borderRadius:4, cursor:'pointer', fontFamily:'inherit' }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowLogout(true)}
            style={{ display:'flex', alignItems:'center', gap:8, backgroundColor:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,0.4)', padding:'8px 16px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
            <i className="fas fa-sign-out-alt"/> Sign Out
          </button>
        </div>
      </nav>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* Shared footer */}
      <SiteFooter />

      {/* ── Sign Out Confirm Modal ─────────────────────────────────────── */}
      {showLogout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', maxWidth: 380, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 56, height: 56, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="fas fa-sign-out-alt" style={{ color: '#ef4444', fontSize: 22 }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Confirm Sign Out</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Are you sure you want to sign out?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowLogout(false)}
                style={{ background: '#f1f5f9', border: 'none', color: '#374151', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleLogout}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
