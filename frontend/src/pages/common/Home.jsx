import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { homeApi } from '../../services/api'

/**
 * Home page — fully data-driven from API.
 * Replicates Home.aspx + MasterPageWithoutSession.master exactly:
 *   - Marquee ticker (CategoryID = 1)
 *   - Notifications tab (CategoryID = 3)
 *   - News tab (CategoryID = 2)
 *   - Downloads tab (CategoryID = 4)
 *   - Popup modal (CategoryID = 11) — shown once per session
 *   - Dynamic nav menu from Menu_GetMenu SP
 *   - Login/Register buttons shown only when IsRegistrationOpen = true
 */
export default function Home() {
  const navigate = useNavigate()

  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('notifications')
  const [marqueeOn,  setMarqueeOn]  = useState(true)
  const [showPopup,  setShowPopup]  = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    homeApi.getHomeData(1)
      .then(res => {
        setData(res.data)
        // Show popup once per session (same as old code using sessionStorage)
        if (res.data.popup && !sessionStorage.getItem('mpkv_popup_shown')) {
          setShowPopup(true)
          sessionStorage.setItem('mpkv_popup_shown', '1')
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const tabs = [
    { key: 'notifications', icon: 'fa-bell',      label: 'Notifications', items: data?.notifications ?? [] },
    { key: 'news',          icon: 'fa-newspaper', label: 'News',          items: data?.news          ?? [] },
    { key: 'downloads',     icon: 'fa-download',  label: 'Downloads',     items: data?.downloads     ?? [] },
  ]

  const currentItems = tabs.find(t => t.key === activeTab)?.items ?? []

  const quickLinks = [
    { to: '/search-college', icon: 'fa-search',          title: 'Search Colleges',  sub: 'Find affiliated institutions' },
    { to: '/allotment',      icon: 'fa-list-ol',          title: 'Check Allotment',  sub: 'View admission status'        },
    { to: '/about',          icon: 'fa-question-circle',  title: 'Help & FAQs',      sub: 'Get assistance'               },
  ]

  // Build announcement ticker text from live data
  const announcementText = data?.announcements?.length
    ? data.announcements.map(a => a.contentType === 'T' ? a.textContent : a.title).join('  |  ')
    : 'Welcome to MPKV Candidate Portal — Online Agriculture Diploma Admissions 2026'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">

      {/* ── Brand Header ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-[68px] h-[68px] rounded-full border border-gray-200 shadow-md bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="/MPKVLogo.png" alt="MPKV Logo" className="w-[66px] h-[66px] object-contain" />
            </div>
            <div>
              <div className="text-[13px] sm:text-[15px] text-gray-500 leading-tight">
                महात्मा फुले कृषि विद्यापीठ, राहुरी, अहिल्यानगर, महाराष्ट्र
              </div>
              <div className="text-[18px] sm:text-[24px] font-bold text-gray-900 leading-tight">
                Mahatma Phule Agriculture University
              </div>
              <div className="text-[12px] sm:text-[14px] text-gray-500">
                Rahuri, Ahilyanagar, Maharashtra
              </div>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full border border-teal-200">
              <i className="fas fa-graduation-cap" /> ADMISSIONS PORTAL
            </span>
            <p className="text-xs text-gray-500 mt-1.5 max-w-[260px] leading-snug">
              {data?.websiteHeader ?? 'Online Agriculture Diploma Admissions - 2026'}
            </p>
          </div>
        </div>
      </header>

      {/* ── Dark Navbar ───────────────────────────────────────────────────── */}
      <nav className="bg-[#14212e]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center justify-between">

          {/* Dynamic menu from SP */}
          <ul className="hidden md:flex items-center">
            {loading ? (
              // Skeleton while loading
              [1,2,3,4].map(i => (
                <li key={i} className="px-4 py-3">
                  <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                </li>
              ))
            ) : data?.menuItems?.length ? (
              data.menuItems.map(item => (
                <li key={item.menuId} className="relative group">
                  <a
                    href={item.linkUrl || '#'}
                    className="flex items-center gap-1.5 text-white text-[14px] font-medium px-4 py-3 border border-transparent hover:bg-white/10 hover:border-emerald-500 rounded-md transition-all"
                    target={item.target || '_self'}
                  >
                    {item.linkName}
                    {item.children?.length > 0 && (
                      <i className="fas fa-chevron-down text-[10px] opacity-60" />
                    )}
                  </a>
                  {/* Dropdown children */}
                  {item.children?.length > 0 && (
                    <div className="absolute top-full left-0 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-xl min-w-[200px] z-50 py-1">
                      {item.children.map(child => (
                        <a
                          key={child.menuId}
                          href={child.linkUrl}
                          target={child.target || '_self'}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          {child.linkName}
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))
            ) : (
              // Fallback static links
              [
                { label: 'Home',            href: '/'               },
                { label: 'Search Colleges', href: '/search-college' },
                { label: 'Allotment List',  href: '/allotment'      },
                { label: 'About Us',        href: '/about'          },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href}
                    className="flex items-center text-white text-[14px] font-medium px-4 py-3 border border-transparent hover:bg-white/10 hover:border-emerald-500 rounded-md transition-all">
                    {link.label}
                  </Link>
                </li>
              ))
            )}
          </ul>

          {/* Right: Language + Login/Register buttons */}
          <div className="flex items-center gap-2 py-2">
            {/* Language toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-white/10 border border-white/20 rounded-md p-1">
              <button className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-600 text-white">EN</button>
              <button className="text-xs font-bold px-2.5 py-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition">मराठी</button>
            </div>

            {/* Show Register + Login only when registration is open — same as old master page */}
            {data?.isRegistrationOpen ? (
              <>
                <Link to="/register"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-md transition-colors whitespace-nowrap">
                  <i className="fas fa-plus text-xs" /> New Registration
                </Link>
                <Link to="/login"
                  className="flex items-center gap-1.5 border border-white/40 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-white/10 transition-colors whitespace-nowrap">
                  Log In →
                </Link>
              </>
            ) : (
              <Link to="/login"
                className="flex items-center gap-1.5 border border-white/40 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-white/10 transition-colors whitespace-nowrap">
                Log In →
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenu(m => !m)}
              className="md:hidden text-white ml-1"
            >
              <i className={`fas ${mobileMenu ? 'fa-times' : 'fa-bars'} text-lg`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-[#1a2b3c] border-t border-white/10 px-4 py-3 space-y-1">
            {(data?.menuItems ?? []).map(item => (
              <a key={item.menuId} href={item.linkUrl || '#'}
                className="block text-white text-sm py-2 px-3 rounded hover:bg-white/10">
                {item.linkName}
              </a>
            ))}
            <Link to="/login" className="block text-emerald-400 text-sm py-2 px-3">Log In →</Link>
          </div>
        )}
      </nav>

      {/* ── Updates Ticker ────────────────────────────────────────────────── */}
      <div className="flex items-center bg-amber-50 border-b border-amber-200 px-4 py-2 gap-3">
        <span className="flex items-center gap-1.5 bg-amber-400 text-white text-[11px] font-bold px-2.5 py-1 rounded flex-shrink-0">
          <i className="fas fa-bolt" /> UPDATES
        </span>
        <div className="flex-1 overflow-hidden text-[13px] text-amber-800">
          {marqueeOn
            ? <marquee>{announcementText}</marquee>
            : <span className="truncate block">{announcementText}</span>
          }
        </div>
        <button
          onClick={() => setMarqueeOn(m => !m)}
          className="text-amber-500 hover:text-amber-700 text-base flex-shrink-0"
          title={marqueeOn ? 'Pause' : 'Play'}
        >
          <i className={`fas ${marqueeOn ? 'fa-pause-circle' : 'fa-play-circle'}`} />
        </button>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 items-start flex-wrap lg:flex-nowrap">

          {/* LEFT — Notice Board */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Notice Board</h2>
            <p className="text-sm text-gray-500 mb-4">Latest updates and schedules for admissions.</p>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

              {/* Tabs */}
              <div className="flex border-b border-gray-200 px-5 gap-0">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold border-b-2 transition-all rounded-t-lg whitespace-nowrap
                      ${activeTab === tab.key
                        ? 'text-emerald-600 border-emerald-600 bg-emerald-50/60'
                        : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                  >
                    <i className={`fas ${tab.icon} text-xs`} />
                    {tab.label}
                    {tab.items.length > 0 && (
                      <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {tab.items.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-14 h-16 bg-gray-100 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-full" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : currentItems.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <i className="fas fa-inbox text-3xl mb-2 block opacity-40" />
                  <p className="text-sm">No {activeTab} available</p>
                </div>
              ) : (
                <ul className="px-5 m-0 p-0">
                  {activeTab === 'notifications' && currentItems.map((item, i) => <NotificationRow key={i} item={item} />)}
                  {activeTab === 'news'          && currentItems.map((item, i) => <NewsRow         key={i} item={item} />)}
                  {activeTab === 'downloads'     && currentItems.map((item, i) => <DownloadRow     key={i} item={item} />)}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT — Sidebar */}
          <div className="flex flex-col gap-5 w-full lg:w-[310px] flex-shrink-0">

            {/* Quick Access */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 font-bold text-gray-900 text-sm">
                Quick Access
              </div>
              <div className="px-4 py-2 divide-y divide-gray-100">
                {quickLinks.map(qa => (
                  <Link key={qa.to} to={qa.to}
                    className="flex items-center gap-3.5 py-3.5 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className={`fas ${qa.icon} text-emerald-600 text-sm`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{qa.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{qa.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Important Dates — static as in old project */}
            <div className="bg-[#0f172a] rounded-2xl p-5">
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                <i className="fas fa-calendar-alt text-teal-400" /> Important Dates
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Registration Closes',   value: '25 July 2026'   },
                  { label: 'Round 1 Allotment',     value: '02 Aug 2026'    },
                  { label: 'Document Verification', value: '05–08 Aug 2026' },
                  { label: 'Classes Commence',      value: '20 Aug 2026'    },
                ].map((d, i) => (
                  <div key={i} className="border-l-2 border-gray-700 pl-3">
                    <p className="text-[11px] text-gray-500">{d.label}</p>
                    <p className="text-sm font-bold text-white">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#0f172a] text-gray-400">
        <div className="max-w-screen-xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/MPKVLogo.png" alt="MPKV" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">MPKV, Rahuri</div>
                <div className="text-teal-400 text-[10px] uppercase tracking-wider">Admissions Portal</div>
              </div>
            </div>
            <p className="text-sm">Mahatma Phule Krishi Vidyapeeth</p>
            <p className="text-sm">Rahuri, Ahilyanagar,<br />Maharashtra — 413722</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Information</h4>
            <ul className="space-y-2">
              {['About University','Affiliated Colleges','Admission Rules','Fee Structure'].map(item => (
                <li key={item}>
                  <Link to="/about" className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors">
                    <span className="text-teal-400">›</span>{item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2">
              {[
                { label: 'Terms & Conditions', to: '/terms'      },
                { label: 'Privacy Policy',      to: '/privacy'   },
                { label: 'Refund/Cancellation', to: '/refund'    },
                { label: 'Disclaimer',           to: '/disclaimer'},
              ].map(item => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors">
                    <span className="text-teal-400">›</span>{item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Technical Support</h4>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Helpline Number</p>
              <p className="text-white font-bold text-base flex items-center gap-2">
                <i className="fas fa-phone text-teal-400" />
                {data?.helplineMobileNo ?? '+91-8806612998'}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-3 mb-1">Working Hours</p>
              <p className="text-white text-sm flex items-center gap-1.5">
                <i className="far fa-clock text-teal-400" /> 10:00 AM to 6:00 PM
              </p>
              <p className="text-gray-500 text-xs mt-0.5">(All Days Open)</p>
            </div>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span>© 2026 Mahatma Phule Agriculture University. All rights reserved.</span>
          <span>Designed &amp; Developed for Admissions 2026</span>
        </div>
      </footer>

      {/* ── Popup Modal (CategoryID = 11) ─────────────────────────────────── */}
      {showPopup && data?.popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">{data.popup.header}</h3>
              <button
                onClick={() => setShowPopup(false)}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded transition-colors"
              >
                ✕
              </button>
            </div>
            <div
              className="px-5 py-4 overflow-y-auto text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: data.popup.text }}
            />
          </div>
        </div>
      )}

    </div>
  )
}

// ── Notification row — WITH date badge (CategoryID = 3) ──────────────────────
function NotificationRow({ item }) {
  let day = '--', monthYear = '---'
  if (item.publishDate) {
    // publishDate format: "04 Jun 2026"
    const parts = item.publishDate.split(' ')
    if (parts.length === 3) {
      day = parts[0]
      monthYear = parts[1].toUpperCase() + '\u00A0' + parts[2]  // "JUN 2026"
    }
  }

  return (
    <li className="flex gap-4 py-[18px] border-b border-gray-100 last:border-0 list-none">
      {/* Date badge — same as Notifications.ascx */}
      <div className="min-w-[58px] text-center bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-[6px] py-[10px] flex-shrink-0 flex flex-col items-center justify-center">
        <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-[.05em] leading-tight">{monthYear}</div>
        <div className="text-[24px] font-extrabold text-[#1e293b] leading-none">{day}</div>
      </div>
      {/* Content */}
      <div className="text-[13.5px] text-[#334155] leading-relaxed flex-1">
        {item.contentType === 'T'
          ? <span dangerouslySetInnerHTML={{ __html: item.textContent }} />
          : <div className="popup-box">
              <a href={item.fileContentUrl} target="_blank" rel="noreferrer"
                className="text-blue-600 hover:underline">
                {item.title}
              </a>
            </div>
        }
        {item.isNew && (
          <img src="/new.gif" alt="new" className="inline ml-1 h-[15px]" />
        )}
      </div>
    </li>
  )
}

// ── News row — arrow + text/link, NO date badge (News.ascx) ─────────────────
function NewsRow({ item }) {
  return (
    <li className="flex items-center gap-2 py-[14px] border-b border-gray-100 last:border-0 text-[13.5px] text-[#334155] leading-relaxed list-none">
      <i className="fa fa-arrow-right text-emerald-600 flex-shrink-0 text-xs" />
      {item.contentType === 'T'
        ? <span dangerouslySetInnerHTML={{ __html: item.textContent }} />
        : <a href={item.fileContentUrl} target="_blank" rel="noreferrer"
            className="text-blue-600 hover:underline">
            {item.title}
          </a>
      }
      {item.isNew && <img src="/new.gif" alt="new" className="inline ml-1 h-[15px]" />}
    </li>
  )
}

// ── Downloads row — arrow + link, NO date badge (Downloads.ascx) ─────────────
function DownloadRow({ item }) {
  return (
    <li className="flex items-center gap-2 py-[14px] border-b border-gray-100 last:border-0 text-[13.5px] text-[#334155] leading-relaxed list-none">
      <i className="fa fa-arrow-right text-emerald-600 flex-shrink-0 text-xs" />
      {item.contentType === 'T'
        ? <span dangerouslySetInnerHTML={{ __html: item.textContent }} />
        : <a href={item.fileContentUrl} target="_blank" rel="noreferrer"
            className="text-blue-600 hover:underline">
            {item.title}
          </a>
      }
      {item.isNew && <img src="/new.gif" alt="new" className="inline ml-1 h-[15px]" />}
    </li>
  )
}
