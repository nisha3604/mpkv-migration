import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardApi } from '../services/api'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

// resolvePhotoUrl kept for backwards compat (SiteHeader has its own copy)
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

/**
 * Navbar — MasterPageWithSession equivalent (shown after login).
 *
 * Screenshot exact match:
 *   Header : Logo | University name (Marathi + English) | Right: candidate photo (circular, clickable → Sign Out dropdown)
 *   Navbar : bg-[#14212e]
 *     Dashboard | Allotment / Admission Menu ▼ | Application Form ▼ | Miscellaneous ▼  |  EN  मराठी
 *
 *  Dropdown menus:
 *    Allotment / Admission Menu:
 *      - Check Allotment Status
 *      - Confirm Admission
 *      - Cancel Admission
 *      - Allotment Summary
 *      - Admission Letter
 *    Application Form:
 *      - Personal Info
 *      - Address Details
 *      - Category & Reservation
 *      - Qualification Details
 *      - Sports Details
 *      - Shortlist Options
 *      - Upload Photo & Signature
 *      - Upload Documents
 *      - Pay Application Fee
 *      - Application Form Summary
 *    Miscellaneous:
 *      - Change Password
 *      - Change Mobile / Email
 *      - Change Security Question
 */
export default function Navbar() {
  const { user, logout, isLoggedIn, updateUser } = useAuth()
  const location = useLocation()

  const [langActive,      setLangActive]     = useState(() => {
    try { return localStorage.getItem('mpkv_lang') || 'en' } catch { return 'en' }
  })
  const [openDropdown,    setOpenDropdown]   = useState(null)
  const [mobileOpen,      setMobileOpen]     = useState(false)
  const [mobileExpand,    setMobileExpand]   = useState(null)
  const [showLogoutModal, setShowLogoutModal]= useState(false)
  const [isFormLocked,    setIsFormLocked]   = useState(user?.formLocked === true)

  const navRef    = useRef(null)   // dark navbar
  const headerRef = useRef(null)   // for click-outside (unused but kept for safety)

  // Fetch real lock status from backend on every mount —
  // so the correct menu shows on every page, not just after visiting Dashboard.
  useEffect(() => {
    if (!isLoggedIn) return
    dashboardApi.getDashboard()
      .then(res => {
        const locked = res.data?.isFormLocked ?? false
        setIsFormLocked(locked)
        if (updateUser) updateUser({ formLocked: locked })
      })
      .catch(() => {
        // Fall back to localStorage value if API call fails
        setIsFormLocked(user?.formLocked === true)
      })
  }, [isLoggedIn])

  // Also sync immediately when user.formLocked changes in localStorage
  // (e.g. after UnlockForm sets updateUser({ formLocked: false }))
  useEffect(() => {
    setIsFormLocked(user?.formLocked === true)
  }, [user?.formLocked])

  // ── Close ALL dropdowns when clicking outside both nav + header ───────────
  useEffect(() => {
    const handler = e => {
      const inNav    = navRef.current    && navRef.current.contains(e.target)
      const inHeader = headerRef.current && headerRef.current.contains(e.target)
      if (!inNav && !inHeader) setOpenDropdown(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Logout — show styled modal instead of browser confirm ──────────────
  const handleLogout = () => {
    setOpenDropdown(null)          // close photo dropdown first
    setShowLogoutModal(true)       // show our custom modal
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    logout()
    window.location.replace('/')
  }

  const toggleDropdown = key =>
    setOpenDropdown(prev => prev === key ? null : key)

  // menus — isFormLocked is set by dashboard API on mount
  const menus = [
    {
      key: 'allotment',
      label: 'Allotment / Admission Menu',
      items: [
        { label: 'Pay Category Conversion Fee',  to: '/admission/pay-category-fee'    },
        { label: 'Check Allotment Status',        to: '/admission/allotment-status'    },
        { label: 'Allotment / Admission Summary', to: '/admission/allotment-summary'   },
      ]
    },
    {
      key: 'appform',
      label: 'Application Form',
      // Locked: only Print + Unlock — exactly as old project after locking
      items: isFormLocked
        ? [
            { label: 'Print Application Form',  to: '/candidate/application-form' },
            { label: 'Unlock Application Form', to: '/candidate/unlock-form'       },
          ]
        : [
            { label: 'Personal Details',                     to: '/candidate/personal'      },
            { label: 'Address Details',                      to: '/candidate/address'       },
            { label: 'Category & Other Reservation Details', to: '/candidate/category'      },
            { label: 'Qualification Details',                to: '/candidate/qualification' },
            { label: 'Sports Details',                       to: '/candidate/sports'        },
            { label: 'Shortlist Colleges',                   to: '/candidate/shortlist'     },
            { label: 'Set Preferences',                      to: '/candidate/preferences'   },
            { label: 'Upload Photo & Sign',                  to: '/candidate/photo-sign'    },
            { label: 'Upload Required Documents',            to: '/candidate/documents'     },
            { label: 'Pay Application Fee',                  to: '/candidate/fee'           },
            { label: 'Lock Application Form',                to: '/candidate/summary'       },
          ]
    },
    {
      key: 'misc',
      label: 'Miscellaneous',
      items: [
        { label: 'Change Password',          to: '/candidate/change-password'          },
        { label: 'Change Mobile / E-Mail',   to: '/candidate/change-mobile-email'      },
        { label: 'Change Security Question', to: '/candidate/change-security-question' },
        { label: 'Check Payment History',    to: '/candidate/payment-history'          },
      ]
    },
  ]

  // ── Shared nav link style (desktop)
  const navLinkStyle = (isActive = false) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    color: '#ffffff', textDecoration: 'none',
    fontSize: 15, fontWeight: 500,
    padding: '10px 16px', whiteSpace: 'nowrap',
    border: `1.5px solid ${isActive ? '#059669' : 'transparent'}`,
    borderRadius: 6,
    cursor: 'pointer',
    background: isActive ? '#059669' : 'transparent',
    transition: 'all 0.2s ease', fontFamily: 'inherit'
  })

  const isMenuActive = () => false

  const getDropItemStyle = (isActive = false) => ({
    display: 'block',
    padding: '11px 20px',
    fontSize: 14,
    lineHeight: 1.4,
    color: isActive ? '#059669' : '#334155',
    fontWeight: isActive ? 600 : 400,
    textDecoration: 'none',
    background: isActive ? '#ecfdf5' : '#ffffff',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  })

  // ── Dropdown panel style
  const dropdownStyle = {
    position: 'absolute', top: '100%', left: 0, marginTop: 2,
    background: '#ffffff', border: '1px solid #e2e8f0',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    borderRadius: 10, minWidth: 280, zIndex: 999,
    padding: '6px 0', overflow: 'hidden'
  }

  if (!isLoggedIn) return null   // only render when logged in

  return (
    <>
      {/* Shared university header */}
      <SiteHeader onSignOut={() => setShowLogoutModal(true)} />

      {/* ════════════════════════════════════════════════════════════════
          DARK NAVBAR — same as MasterPageWithSession nav
      ════════════════════════════════════════════════════════════════ */}
      <nav
        ref={navRef}
        style={{
          backgroundColor: '#14212e', padding: '0 30px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', zIndex: 40
        }}
      >
        {/* Desktop nav */}
        <ul style={{ display: 'flex', flexDirection: 'row', listStyle: 'none', margin: 0, padding: 0, gap: 4 }}
          className="hidden md:flex">

          {/* Dashboard — plain link, no dropdown */}
          <li>
            <Link
              to="/candidate/dashboard"
              style={navLinkStyle(false)}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = '#1fa876' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
            >
              Dashboard
            </Link>
          </li>

          {/* Dropdown menus */}
          {menus.map(menu => {
            const menuActive = isMenuActive(menu)
            const menuOpen = openDropdown === menu.key
            return (
            <li key={menu.key} style={{ position: 'relative' }}>
              <button
                onClick={() => toggleDropdown(menu.key)}
                style={navLinkStyle(menuActive || menuOpen)}
                onMouseEnter={e => { if (!menuActive && !menuOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = '#1fa876' } }}
                onMouseLeave={e => {
                  if (!menuActive && !menuOpen) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'transparent'
                  }
                }}
              >
                {menu.label}
                <i className={`fas fa-chevron-${menuOpen ? 'up' : 'down'}`}
                  style={{ fontSize: 11, marginLeft: 4 }} />
              </button>

              {/* Dropdown panel */}
              {menuOpen && (
                <div style={dropdownStyle}>
                  {menu.items.map(item => {
                    const itemActive = location.pathname === item.to
                    return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpenDropdown(null)}
                      style={getDropItemStyle(itemActive)}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf9'; if (!itemActive) e.currentTarget.style.color = '#059669' }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = itemActive ? '#ecfdf5' : '#ffffff'
                        e.currentTarget.style.color = itemActive ? '#059669' : '#334155'
                      }}
                    >
                      {item.label}
                    </Link>
                    )
                  })}
                </div>
              )}
            </li>
            )
          })}
        </ul>

        {/* Right: Language toggle + Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 6, padding: 3
          }}>
            <button
              onClick={() => { setLangActive('en'); window.setLang && window.setLang('en') }}
              style={{
                background: langActive === 'en' ? '#059669' : 'transparent',
                border: 'none', color: langActive === 'en' ? '#fff' : 'rgba(255,255,255,0.75)',
                fontSize: 13, fontWeight: 600, padding: '5px 11px',
                borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit'
              }}
            >EN</button>
            <button
              onClick={() => { setLangActive('mr'); window.setLang && window.setLang('mr') }}
              style={{
                background: langActive === 'mr' ? '#059669' : 'transparent',
                border: 'none', color: langActive === 'mr' ? '#fff' : 'rgba(255,255,255,0.75)',
                fontSize: 13, fontWeight: 600, padding: '5px 11px',
                borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit'
              }}
            >मराठी</button>
          </div>

          {/* Sign Out — desktop only, matches CollegeLayout style */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="hidden md:flex"
            style={{
              alignItems: 'center', gap: 8,
              backgroundColor: 'transparent', color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.4)',
              padding: '8px 16px', borderRadius: 6,
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <i className="fas fa-sign-out-alt" />
            Sign Out
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(o => !o)}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: '8px 4px' }}
          >
            <i className={`fas ${mobileOpen ? 'fa-times' : 'fa-bars'}`} />
          </button>
        </div>

        {/* ── Mobile nav panel */}
        {mobileOpen && (
          <div className="md:hidden" style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#1a2d3e', zIndex: 999, padding: '8px 0'
          }}>
            <Link to="/candidate/dashboard"
              onClick={() => setMobileOpen(false)}
              style={{ display: 'block', color: '#fff', padding: '10px 20px', textDecoration: 'none', fontSize: 15 }}>
              Dashboard
            </Link>

            {menus.map(menu => (
              <div key={menu.key}>
                <button
                  onClick={() => setMobileExpand(mobileExpand === menu.key ? null : menu.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', color: '#fff', padding: '10px 20px',
                    background: 'transparent', border: 'none', fontSize: 15,
                    fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  {menu.label}
                  <i className={`fas fa-chevron-${mobileExpand === menu.key ? 'up' : 'down'}`} style={{ fontSize: 11 }} />
                </button>

                {mobileExpand === menu.key && (
                  <div style={{ background: '#0f1f2e', paddingLeft: 16 }}>
                    {menu.items.map(item => {
                      const itemActive = location.pathname === item.to
                      return (
                      <Link key={item.to} to={item.to}
                        onClick={() => { setMobileOpen(false); setMobileExpand(null) }}
                        style={{
                          display: 'block',
                          color: itemActive ? '#34d399' : '#94a3b8',
                          background: itemActive ? 'rgba(5,150,105,0.15)' : 'transparent',
                          padding: '8px 20px',
                          textDecoration: 'none',
                          fontSize: 14,
                          fontWeight: itemActive ? 600 : 400,
                        }}>
                        {item.label}
                      </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); handleLogout() }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                color: '#fca5a5', padding: '10px 20px', background: 'transparent',
                border: 'none', fontSize: 15, fontFamily: 'inherit', cursor: 'pointer'
              }}
            >
              <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }} /> Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════════════════════════
          SIGN OUT CONFIRMATION MODAL — styled to match project UI
          Same as old mpeConfirmBox / sweetAlertConfirm behaviour
      ════════════════════════════════════════════════════════════════ */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 14,
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            width: '100%', maxWidth: 420,
            overflow: 'hidden', fontFamily: 'inherit'
          }}>

            {/* Modal header — dark bar matching navbar */}
            <div style={{
              background: '#14212e',
              padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(220,53,69,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <i className="fas fa-sign-out-alt" style={{ color: '#f87171', fontSize: 14 }} />
                </div>
                <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 15 }}>
                  Sign Out
                </span>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff', width: 28, height: 28,
                  borderRadius: 6, cursor: 'pointer',
                  fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit'
                }}
              >✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '24px 24px 8px', textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#fef2f2', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#dc3545', fontSize: 22 }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
                Are you sure you want to Sign Out?
              </p>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                You might lose unsaved data.<br />
                You will need to log in again to continue.
              </p>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '16px 24px 24px',
              display: 'flex', gap: 12
            }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: '10px 0',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 8, fontSize: 14,
                  fontWeight: 600, color: '#374151',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1, padding: '10px 0',
                  background: '#dc3545',
                  border: 'none',
                  borderRadius: 8, fontSize: 14,
                  fontWeight: 600, color: '#ffffff',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.background = '#dc3545'}
              >
                <i className="fas fa-sign-out-alt" style={{ fontSize: 13 }} />
                Yes, Sign Out
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  )
}
