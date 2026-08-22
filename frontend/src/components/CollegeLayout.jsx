import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * CollegeLayout — wraps all college + admin pages.
 * Same header as Candidate but with college/admin specific nav links.
 */
export default function CollegeLayout({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const V = { navy: '#14212e', primary: '#059669' }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '10px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/MPKVLogo.png" alt="MPKV" style={{ width: 56, height: 56, objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Mahatma Phule Agriculture University</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Rahuri, Ahilyanagar, Maharashtra</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user?.photoPath && (
              <img src={user.photoPath.startsWith('http') ? user.photoPath : `http://localhost:7002${user.photoPath}`}
                alt="User" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{user?.userName}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{user?.userLoginID}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ background: V.navy, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavLink to={isAdmin ? '/admin/dashboard' : '/college/dashboard'} label="Dashboard" />
        {isAdmin ? (
          <>
            <NavLink to="/admin/college/list"           label="College List" />
            <NavLink to="/admin/college/passwords"       label="College Passwords" />
            <NavLink to="/admin/college/reset-password"  label="Reset Password" />
          </>
        ) : (
          <>
            <NavLink to="/college/summary" label="College Profile" />
          </>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setShowLogoutModal(true)}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '7px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign Out
          </button>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      {/* Logout modal */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 360, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sign Out?</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Are you sure you want to sign out?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowLogoutModal(false)}
                style={{ background: '#f1f5f9', border: 'none', padding: '9px 22px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleLogout}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NavLink({ to, label }) {
  return (
    <Link to={to} style={{ color: '#fff', textDecoration: 'none', fontSize: 14, padding: '12px 14px', display: 'block', opacity: 0.85 }}
      onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = 0.85; e.currentTarget.style.background = 'transparent' }}>
      {label}
    </Link>
  )
}
