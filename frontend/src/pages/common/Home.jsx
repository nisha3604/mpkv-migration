import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { homeApi } from '../../services/api'
import SiteHeader from '../../components/SiteHeader'
import SiteFooter from '../../components/SiteFooter'

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
  const { isLoggedIn, loading: authLoading, user } = useAuth()

  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('notifications')
  const [marqueeOn,  setMarqueeOn]  = useState(true)
  const [showPopup,  setShowPopup]  = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [langActive, setLangActive] = useState(() => {
    try { return localStorage.getItem('mpkv_lang') || 'en' } catch { return 'en' }
  })

  // Restore saved language on mount
  useEffect(() => {
    if (langActive === 'mr') {
      setTimeout(() => {
        const s = document.querySelector('.goog-te-combo')
        if (s) { s.value = 'mr'; s.dispatchEvent(new Event('change')) }
      }, 800)
    }
  }, [])

  // Fetch home data — always runs (hooks must never be conditional)
  useEffect(() => {
    // Skip fetch if we're about to redirect
    if (isLoggedIn) return
    homeApi.getHomeData(1)
      .then(res => {
        setData(res.data)
        if (res.data.popup && !sessionStorage.getItem('mpkv_popup_shown')) {
          setShowPopup(true)
          sessionStorage.setItem('mpkv_popup_shown', '1')
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  // Already logged in — redirect AFTER all hooks have been declared
  if (!authLoading && isLoggedIn && user?.dashBoardPath) {
    return <Navigate to={user.dashBoardPath} replace />
  }

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

  // Map old ASP.NET .aspx URLs returned by Menu_GetMenu SP → React routes
  const resolveMenuUrl = (url) => {
    if (!url) return '/'
    const u = url.toLowerCase().replace(/\.\.\//g, '').replace(/\\/g, '/')
    if (u.includes('public/home.aspx') || u.endsWith('home.aspx')) return '/'
    if (u.includes('searchcollege')    || u.includes('search-college'))  return '/search-college'
    if (u.includes('allotment'))        return '/allotment'
    if (u.includes('about'))            return '/about'
    if (u.includes('contact'))          return '/contact'
    // Already a React route
    if (url.startsWith('/') && !url.includes('.aspx')) return url
    // Anything else — go home rather than 404
    return '/'
  }

  return (
    <>
      {/* Content — header, navbar, footer provided by PublicLayout in App.jsx */}

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

      {/* ── Shared footer ─────────────────────────────────────────────── */}
      <SiteFooter />

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

    </>
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
