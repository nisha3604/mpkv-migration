import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { appSettingsApi } from '../../services/api'

/**
 * AppSettings — mirrors Administration/CheckAppSettings.aspx
 * Read-only list of all appsettings.json keys + values.
 * Accessible to UserTypeID = 11 (Super Admin) ONLY.
 * Sensitive values are masked by the backend (first 4 chars + ****).
 */
export default function AppSettings() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    // Extra client-side guard — backend already blocks non-11 users
    if (user?.userTypeID !== 11) {
      navigate('/admin/dashboard', { replace: true })
      return
    }
    appSettingsApi.getList()
      .then(r => {
        if (r.data?.success) setItems(r.data.items ?? [])
        else setError(r.data?.message || 'Failed to load settings.')
      })
      .catch(e => {
        if (e.response?.status === 401) { logout(); navigate('/login') }
        else if (e.response?.status === 403) navigate('/admin/dashboard', { replace: true })
        else setError('Failed to load settings. Please refresh.')
      })
      .finally(() => setLoading(false))
  }, [])

  // Filter by search
  const filtered = items.filter(item =>
    item.key.toLowerCase().includes(search.toLowerCase()) ||
    (item.value ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // Export to Excel (client-side — build a simple HTML table and download)
  const handleExport = () => {
    const rows = filtered.map((item, i) =>
      `<tr><td>${i + 1}</td><td>${escHtml(item.key)}</td><td>${escHtml(item.value ?? '')}</td></tr>`
    ).join('')
    const html = `<table border="1">
      <thead><tr><th>Sr.</th><th>Key</th><th>Value</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'AppSettings.xls'
    a.click()
    URL.revokeObjectURL(url)
  }

  const V = {
    navy  : '#14212e',
    border: '#dee2e6',
    bg    : '#f8f9fa',
    white : '#fff',
    muted : '#6c757d',
    danger: '#dc2626',
  }

  const isMasked = (value) => typeof value === 'string' && value.includes('****')

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>

        {/* ── Page header ──────────────────────────────────────────── */}
        <div style={{ background:V.navy, borderRadius:'8px 8px 0 0', padding:'10px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>
            <i className="fas fa-cog" style={{ marginRight:8 }} />App Keys List
          </h5>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ background:'rgba(239,68,68,.2)', border:'1px solid rgba(239,68,68,.4)', borderRadius:6, padding:'2px 10px', fontSize:11, fontWeight:700, color:'#fca5a5', letterSpacing:'.05em' }}>
              <i className="fas fa-shield-alt" style={{ marginRight:5 }} />Super Admin Only
            </span>
          </div>
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderTop:'none', padding:'12px 18px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          {/* Search */}
          <div style={{ position:'relative', flex:1, minWidth:220 }}>
            <i className="fas fa-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:V.muted, fontSize:13 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by key or value…"
              style={{ width:'100%', padding:'7px 10px 7px 32px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='#059669'}
              onBlur={e  => e.target.style.borderColor=V.border}
            />
          </div>
          {/* Count */}
          <span style={{ fontSize:12.5, color:V.muted, flexShrink:0 }}>
            {filtered.length} of {items.length} keys
          </span>
          {/* Export */}
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            style={{ background:'#dc2626', color:'#fff', border:'none', padding:'7px 18px', borderRadius:5, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7, flexShrink:0 }}
            onMouseEnter={e => e.currentTarget.style.background='#b91c1c'}
            onMouseLeave={e => e.currentTarget.style.background='#dc2626'}>
            <i className="fas fa-file-excel" />Export to Excel
          </button>
        </div>

        {/* ── Error ────────────────────────────────────────────────── */}
        {error && (
          <div style={{ background:'#fef2f2', border:`1px solid #fecaca`, borderTop:'none', color:V.danger, padding:'10px 18px', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle" />{error}
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────── */}
        <div style={{ border:`1px solid ${V.border}`, borderTop:'none', borderRadius:'0 0 8px 8px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:56, background:V.white }}>
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p style={{ color:V.muted, fontSize:13 }}>Loading configuration keys…</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:V.navy }}>
                    <th style={th('5%',  'center')}>Sr.</th>
                    <th style={th('30%', 'left'  )}>Key</th>
                    <th style={th('65%', 'left'  )}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding:36, textAlign:'center', color:V.muted, fontSize:13 }}>
                        No keys match your filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item, i) => (
                      <tr key={item.key}
                        style={{ background: i % 2 === 0 ? V.white : V.bg, borderBottom:`1px solid ${V.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background='#f0fdf4'}
                        onMouseLeave={e => e.currentTarget.style.background=i%2===0?V.white:V.bg}>
                        <td style={{ padding:'8px 14px', textAlign:'center', color:V.muted }}>{i + 1}.</td>
                        <td style={{ padding:'8px 14px', fontWeight:600, color:'#1e293b', wordBreak:'break-all' }}>
                          {/* Highlight search term */}
                          {highlight(item.key, search)}
                        </td>
                        <td style={{ padding:'8px 14px', wordBreak:'break-all' }}>
                          {isMasked(item.value) ? (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:6, color:V.muted, fontFamily:'monospace' }}>
                              <i className="fas fa-lock" style={{ fontSize:11, color:'#f59e0b' }} />
                              {item.value}
                            </span>
                          ) : (
                            <span style={{ color:'#374151' }}>{highlight(item.value ?? '—', search)}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer note ──────────────────────────────────────────── */}
        {!loading && items.length > 0 && (
          <p style={{ fontSize:11.5, color:V.muted, marginTop:10, textAlign:'right' }}>
            <i className="fas fa-info-circle" style={{ marginRight:5 }} />
            Sensitive values (passwords, secret keys) are partially masked for security.
          </p>
        )}

      </div>
    </div>
  )
}

/* ── helpers ───────────────────────────────────────────────────────────── */
function th(width, align) {
  return {
    padding   : '9px 14px',
    color     : '#fff',
    fontWeight: 700,
    fontSize  : 11.5,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    textAlign : align,
    width,
    whiteSpace: 'nowrap',
  }
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

/** Wraps matching substring in a yellow highlight span */
function highlight(text, query) {
  if (!query || !text) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background:'#fef08a', padding:0 }}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}
