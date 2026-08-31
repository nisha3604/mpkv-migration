import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function CollegeLayout({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate                  = useNavigate()
  const [showLogout,    setShowLogout]    = useState(false)
  const [showProfile,   setShowProfile]   = useState(false)
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [langActive,    setLangActive]    = useState(() => {
    try { return localStorage.getItem('mpkv_lang') || 'en' } catch { return 'en' }
  })
  const profileRef = useRef(null)

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = e => { if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const dashPath = isAdmin ? '/admin/dashboard' : '/college/dashboard'

  // ── Exact menu structure from Menu_GetMenu SP for UserTypeID=61 ──────────
  // ParentMenuID=0 items + their children — mirrors GetMenu() in MasterPageWithSession.Master.cs
  const navItems = isAdmin
    ? [
        { label: 'Dashboard',             to: '/admin/dashboard',              children: [] },
        { label: 'College List',           to: '/admin/college/list',           children: [] },
        { label: 'College Passwords',      to: '/admin/college/passwords',      children: [] },
        { label: 'Reset Password',         to: '/admin/college/reset-password', children: [] },
      ]
    : [
        // Dashboard is hardcoded (prepended in GetMenu like old master page)
        { label: 'Admission Menu', to: null, children: [
            { label: 'Check Allotment Status',       to: '/college/admission/allotment-status'    },
            { label: 'Confirm Admission',            to: '/college/admission/confirm'             },
            { label: 'Cancel Admission',             to: '/college/admission/cancel'              },
            { label: 'Print Admission Letter',       to: '/college/admission/admission-letter'    },
            { label: 'Print Rejection Letter',       to: '/college/admission/rejection-letter'    },
            { label: 'Print Cancellation Letter',    to: '/college/admission/cancellation-letter' },
          ]
        },
        { label: 'Spot Round Menu', to: null, children: [
            { label: 'Offer Seat', to: '/college/spot-round/offer-seat' },
          ]
        },
        { label: 'Reports Menu', to: null, children: [
            { label: 'College Summary',                            to: '/college/summary'                },
            { label: 'Allotment Report',                          to: '/college/reports/allotment'      },
            { label: 'Composite Admission Report',                to: '/college/reports/composite'      },
            { label: 'List of Candidates Eligible for Counselling', to: '/college/reports/eligible'    },
          ]
        },
        { label: 'Miscellaneous', to: null, children: [
            { label: 'Update Profile',           to: '/college/misc/update-profile'        },
            { label: 'Change Security Question', to: '/college/misc/security-question'     },
            { label: 'Change Password',          to: '/college/misc/change-password'       },
          ]
        },
      ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      {/* ── University Header ──────────────────────────────────────────── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', flexShrink: 0, overflow: 'hidden' }}>
              <img src="/MPKVLogo.png" alt="MPKV Logo" style={{ width: 68, height: 68, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.3 }}>महात्मा फुले कृषि विद्यापीठ, राहुरी, अहिल्यानगर, महाराष्ट्र</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Mahatma Phule Agriculture University</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Rahuri, Ahilyanagar, Maharashtra</div>
            </div>
          </div>

          {/* Right: clickable profile image only */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <img
              src="/dummy-user.png"
              alt="Profile"
              onClick={() => setShowProfile(p => !p)}
              style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid #e2e8f0', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
              onError={e => { e.currentTarget.src = '/dummy-user.png' }}
            />

            {/* Dropdown */}
            {showProfile && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 9999,
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: 200, overflow: 'hidden'
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Logged in as</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{user?.userLoginID}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{isAdmin ? 'Administrator' : `College · ${user?.userLoginID}`}</div>
                </div>
                <button
                  onClick={() => { setShowProfile(false); setShowLogout(true) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#ef4444', fontWeight: 600, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <i className="fas fa-sign-out-alt" style={{ fontSize: 13 }}/> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Dark Navbar ────────────────────────────────────────────────── */}
      <nav style={{ backgroundColor: '#14212e', padding: '0 24px', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 40 }}>

        {/* Nav items */}
        <ul style={{ display: 'flex', flexDirection: 'row', listStyle: 'none', margin: 0, padding: 0, flex: 1 }}>
          {/* Dashboard — always first, hardcoded like old master page */}
          <NavItem to={dashPath} label="Dashboard" />
          {/* Dynamic menu items from DB */}
          {navItems.map(item =>
            item.children && item.children.length > 0
              ? <DropdownItem key={item.label} label={item.label} children={item.children} />
              : <NavItem key={item.to} to={item.to} label={item.label} />
          )}
        </ul>

        {/* Right: language toggle + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Language toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: 3 }}>
            <button onClick={() => { setLangActive('en'); window.setLang && window.setLang('en') }}
              style={{ background: langActive === 'en' ? '#059669' : 'transparent', border: 'none', color: langActive === 'en' ? '#fff' : 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600, padding: '5px 11px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>
              EN
            </button>
            <button onClick={() => { setLangActive('mr'); window.setLang && window.setLang('mr') }}
              style={{ background: langActive === 'mr' ? '#059669' : 'transparent', border: 'none', color: langActive === 'mr' ? '#fff' : 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600, padding: '5px 11px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>
              मराठी
            </button>
          </div>

          {/* Sign Out */}
          <button onClick={() => setShowLogout(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <i className="fas fa-sign-out-alt" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', padding: '12px 0', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
        © {new Date().getFullYear()} Mahatma Phule Krishi Vidyapeeth, Rahuri. All Rights Reserved.
      </footer>

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

// ── Nav item with active highlight ────────────────────────────────────────────
function NavItem({ to, label }) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <li>
      <Link to={to}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: isActive ? '#ffffff' : 'rgba(255,255,255,0.75)',
          textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 500,
          padding: '12px 16px', whiteSpace: 'nowrap',
          borderBottom: isActive ? '2px solid #059669' : '2px solid transparent',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' } }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'transparent' } }}>
        {label}
      </Link>
    </li>
  )
}

// ── Dropdown nav item ─────────────────────────────────────────────────────────
function DropdownItem({ label, children }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)
  const location        = useLocation()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Check if any child is active
  const anyActive = children.some(c => location.pathname === c.to)

  return (
    <li ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: anyActive ? '#ffffff' : 'rgba(255,255,255,0.75)',
          background: 'transparent', border: 'none',
          fontSize: 14, fontWeight: anyActive ? 600 : 500,
          padding: '12px 16px', whiteSpace: 'nowrap', cursor: 'pointer',
          fontFamily: 'inherit',
          borderBottom: anyActive ? '2px solid #059669' : '2px solid transparent',
        }}
        onMouseEnter={e => { if (!anyActive) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' } }}
        onMouseLeave={e => { if (!anyActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'transparent' } }}>
        {label}
        <i className={`fas fa-chevron-down`} style={{ fontSize: 10, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 9999,
          background: '#ffffff', border: '1px solid #e2e8f0',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          minWidth: 220, padding: '6px 0',
        }}>
          {children.map(child => (
            <DropdownLink key={child.to} to={child.to} label={child.label} onClose={() => setOpen(false)} />
          ))}
        </div>
      )}
    </li>
  )
}

function DropdownLink({ to, label, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <button
      onClick={() => { navigate(to); onClose() }}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '9px 16px', background: isActive ? '#f0fdf4' : 'transparent',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 13, color: isActive ? '#059669' : '#1e293b',
        fontWeight: isActive ? 600 : 400,
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#f0fdf9'; e.currentTarget.style.color = '#059669' } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1e293b' } }}>
      {label}
    </button>
  )
}
