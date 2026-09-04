import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { menuApi, dashboardApi } from '../services/api'
import { mapUrl, isGroupItem } from '../utils/menuUrlMap'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

/**
 * CandidateNavbar — DB-driven menu via Menu_GetMenu SP.
 *
 * SP logic (UserTypeID=91):
 *  - GroupName='ApplicationFormBeforeLock' items removed when form is locked
 *  - GroupName='ApplicationFormAfterLock' items removed when form is unlocked
 *  This is handled server-side — we just render what comes back.
 *
 * Menu structure:
 *  - ParentMenuID=0 → top-level (either dropdown group or direct link)
 *  - ParentMenuID=X → children of menu X
 *  - isGroupItem(LinkURL) → '#' means dropdown header
 */
export default function CandidateNavbar() {
  const { user, logout, isLoggedIn, updateUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [menuItems,       setMenuItems]       = useState([])   // all items from SP
  const [langActive,      setLangActive]       = useState(() => {
    try { return localStorage.getItem('mpkv_lang') || 'en' } catch { return 'en' }
  })
  const [openDropdown,    setOpenDropdown]     = useState(null)
  const [mobileOpen,      setMobileOpen]       = useState(false)
  const [mobileExpand,    setMobileExpand]     = useState(null)
  const [showLogoutModal, setShowLogoutModal]  = useState(false)

  const navRef = useRef(null)

  // ── Load menu from DB ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return
    menuApi.getMenu(langActive)
      .then(res => { if (res.data.success) setMenuItems(res.data.items ?? []) })
      .catch(() => {/* keep empty — fallback to nothing shown */})
  }, [isLoggedIn, langActive])

  // ── Close dropdowns on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = e => { if (navRef.current && !navRef.current.contains(e.target)) setOpenDropdown(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Build tree: parents + their children ──────────────────────────────────
  const parents  = menuItems.filter(m => m.parentMenuID === 0).sort((a,b) => a.seqNo - b.seqNo)
  const children = (parentId) => menuItems.filter(m => m.parentMenuID === parentId).sort((a,b) => a.seqNo - b.seqNo)

  const confirmLogout = () => { setShowLogoutModal(false); logout(); window.location.replace('/') }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const navLinkBase = {
    display:'flex', alignItems:'center', gap:6,
    color:'#fff', textDecoration:'none', fontSize:14, fontWeight:500,
    padding:'12px 14px', whiteSpace:'nowrap', cursor:'pointer',
    background:'transparent', border:'none', fontFamily:'inherit',
    borderBottom:'2px solid transparent', transition:'all .15s',
  }
  const dropItemBase = {
    display:'block', padding:'9px 16px', fontSize:13,
    color:'#1e293b', fontWeight:400, textDecoration:'none',
    background:'#fff', cursor:'pointer', transition:'background .15s',
    whiteSpace:'nowrap',
  }

  if (!isLoggedIn) return null

  return (
    <>
      <SiteHeader onSignOut={() => setShowLogoutModal(true)} />

      <nav ref={navRef} style={{ background:'#14212e', padding:'0 24px', display:'flex', alignItems:'center', position:'relative', zIndex:40 }}>

        {/* ── Desktop nav ─────────────────────────────────────────────── */}
        <ul style={{ display:'flex', flexDirection:'row', listStyle:'none', margin:0, padding:0, flex:1 }}>

          {/* Dashboard — always first, hardcoded like old master page */}
          <li>
            <Link to="/candidate/dashboard"
              style={{ ...navLinkBase, borderBottom: location.pathname==='/candidate/dashboard' ? '2px solid #059669' : '2px solid transparent' }}
              onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,.06)' }}
              onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}>
              Dashboard
            </Link>
          </li>

          {/* Dynamic menus from DB */}
          {parents.map(item => {
            const kids   = children(item.menuID)
            const isOpen = openDropdown === item.menuID
            const url    = mapUrl(item.linkURL)
            const isGrp  = isGroupItem(item.linkURL) || kids.length > 0

            return (
              <li key={item.menuID} style={{ position:'relative' }}>
                {isGrp ? (
                  // Dropdown group
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : item.menuID)}
                    style={{ ...navLinkBase, borderBottom: isOpen ? '2px solid #059669' : '2px solid transparent' }}
                    onMouseEnter={e=>{ if(!isOpen) e.currentTarget.style.background='rgba(255,255,255,.06)' }}
                    onMouseLeave={e=>{ if(!isOpen) e.currentTarget.style.background='transparent' }}>
                    {item.linkName}
                    <i className={`fas fa-chevron-${isOpen?'up':'down'}`} style={{ fontSize:10, marginLeft:2 }}/>
                  </button>
                ) : (
                  // Direct link
                  <Link to={url} target={item.target||'_self'}
                    style={{ ...navLinkBase, borderBottom: location.pathname===url ? '2px solid #059669' : '2px solid transparent' }}
                    onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,.06)' }}
                    onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}>
                    {item.linkName}
                  </Link>
                )}

                {/* Dropdown panel */}
                {isOpen && kids.length > 0 && (
                  <div style={{ position:'absolute', top:'100%', left:0, zIndex:9999,
                    background:'#fff', border:'1px solid #e2e8f0', borderRadius:8,
                    boxShadow:'0 8px 24px rgba(0,0,0,.14)', minWidth:240, padding:'6px 0' }}>
                    {kids.map(child => {
                      const childUrl = mapUrl(child.linkURL)
                      const isAct    = location.pathname === childUrl
                      return (
                        <Link key={child.menuID}
                          to={childUrl === '#' ? '#' : childUrl}
                          target={child.target || '_self'}
                          onClick={() => setOpenDropdown(null)}
                          style={{ ...dropItemBase, background:isAct?'#f0fdf4':'#fff', color:isAct?'#059669':'#1e293b', fontWeight:isAct?600:400 }}
                          onMouseEnter={e=>{ e.currentTarget.style.background='#f0fdf9'; e.currentTarget.style.color='#059669' }}
                          onMouseLeave={e=>{ e.currentTarget.style.background=isAct?'#f0fdf4':'#fff'; e.currentTarget.style.color=isAct?'#059669':'#1e293b' }}>
                          {child.isNew && <span style={{ background:'#ef4444', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3, marginRight:6 }}>NEW</span>}
                          {child.linkName}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {/* ── Right: language + sign out ──────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {/* Language toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.18)', borderRadius:6, padding:3 }}>
            {[['en','EN'],['mr','मराठी']].map(([code,label]) => (
              <button key={code}
                onClick={() => { setLangActive(code); window.setLang && window.setLang(code) }}
                style={{ background:langActive===code?'#059669':'transparent', border:'none', color:langActive===code?'#fff':'rgba(255,255,255,.75)', fontSize:13, fontWeight:600, padding:'5px 11px', borderRadius:4, cursor:'pointer', fontFamily:'inherit' }}>
                {label}
              </button>
            ))}
          </div>
          {/* Sign out */}
          <button onClick={() => setShowLogoutModal(true)}
            style={{ display:'flex', alignItems:'center', gap:8, background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,.4)', padding:'8px 16px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <i className="fas fa-sign-out-alt"/> Sign Out
          </button>
        </div>
      </nav>

      {/* ── Sign Out Modal ───────────────────────────────────────────────── */}
      {showLogoutModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, maxWidth:400, width:'100%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ background:'#14212e', padding:'13px 20px' }}>
              <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Confirm Sign Out</span>
            </div>
            <div style={{ padding:'24px', textAlign:'center' }}>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <i className="fas fa-sign-out-alt" style={{ color:'#ef4444', fontSize:20 }}/>
              </div>
              <p style={{ fontSize:15, fontWeight:600, color:'#0f172a', margin:'0 0 6px' }}>Are you sure you want to sign out?</p>
              <p style={{ fontSize:13, color:'#64748b', margin:'0 0 20px' }}>You will need to log in again to continue.</p>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button onClick={() => setShowLogoutModal(false)}
                  style={{ background:'#f1f5f9', border:'none', color:'#374151', padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  Cancel
                </button>
                <button onClick={confirmLogout}
                  style={{ background:'#ef4444', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                  <i className="fas fa-sign-out-alt"/> Yes, Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
