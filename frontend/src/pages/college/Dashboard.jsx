import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { collegeApi } from '../../services/api'

export default function CollegeDashboard() {
  const { user, logout }   = useAuth()
  const navigate           = useNavigate()
  const [data,    setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    collegeApi.getDashboard()
      .then(res => setData(res.data.dashboard))
      .catch(err => {
        if (err.response?.status === 401) { logout(); navigate('/login') }
        else setError('Failed to load dashboard. Please refresh.')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p style={{ color:'#64748b', fontSize:14 }}>Loading dashboard...</p>
      </div>
    </div>
  )

  const intake        = data?.intake   ?? 0
  const admitted      = data?.admitted ?? 0
  const vacancy       = data?.vacancy  ?? 0
  const admissionPct  = intake > 0 ? Math.round((admitted / intake) * 100) : 0

  const tiles = [
    { label:'Total Intake', value:intake,   icon:'fa-users',      gradient:'linear-gradient(135deg,#059669,#047857)', shadow:'rgba(5,150,105,.35)'  },
    { label:'Admitted',     value:admitted, icon:'fa-user-check',  gradient:'linear-gradient(135deg,#f59e0b,#d97706)', shadow:'rgba(245,158,11,.35)' },
    { label:'Vacancy',      value:vacancy,  icon:'fa-chair',       gradient:'linear-gradient(135deg,#e11d48,#be123c)', shadow:'rgba(225,29,72,.35)'  },
  ]

  const quickActions = [
    { label:'View College Profile', sub:'View complete college info',   icon:'fa-building',  to:'/college/summary',            color:'#059669' },
    { label:'Edit College Details', sub:'Update college information',   icon:'fa-edit',      to:'/college/edit',                color:'#0ea5e9' },
    { label:'Update Profile',       sub:'Change your account details',  icon:'fa-user-cog',  to:'/college/misc/update-profile', color:'#8b5cf6' },
  ]

  const sessionFields = [
    { label:'USER LOGIN ID',       value: data?.userLoginID       || user?.userLoginID },
    { label:'IP ADDRESS',          value: 'N/A'                                        },
    { label:'USER TYPE',           value: data?.userType          || 'College'         },
    { label:'CURRENT LOGIN TIME',  value: user?.currentLoginDateTime || data?.currentLoginDateTime || new Date().toLocaleString('en-IN') },
    { label:'USER NAME',           value: data?.userName          || user?.userName    },
    {
      label:'PREVIOUS LOGIN TIME',
      value: (user?.lastLoginDateTime && user.lastLoginDateTime.trim().length > 0)
        ? user.lastLoginDateTime
        : (data?.lastLoginDateTime && data.lastLoginDateTime.trim().length > 0
            ? data.lastLoginDateTime
            : 'First Login')
    },
  ]

  return (
    <div style={{ background:'#f1f5f9', minHeight:'100vh', fontFamily:'inherit' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'24px 20px 40px' }}>

        {/* Error */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:12, padding:'12px 18px', marginBottom:20, fontSize:13.5, display:'flex', alignItems:'center', gap:10 }}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {/* ── Hero banner ──────────────────────────────────────────────── */}
        <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)', borderRadius:20, padding:'28px 32px', marginBottom:28, position:'relative', overflow:'hidden', boxShadow:'0 20px 60px rgba(15,23,42,.4)' }}>
          <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(5,150,105,.15)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-60, right:100, width:280, height:280, borderRadius:'50%', background:'rgba(14,165,233,.08)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ background:'rgba(5,150,105,.25)', border:'1px solid rgba(5,150,105,.5)', borderRadius:8, padding:'4px 12px', display:'inline-block', marginBottom:10 }}>
                <span style={{ color:'#34d399', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>
                  <i className="fas fa-circle" style={{ fontSize:6, marginRight:5 }} />College Dashboard
                </span>
              </div>
              <h1 style={{ color:'#fff', fontSize:26, fontWeight:800, margin:'0 0 6px', lineHeight:1.2 }}>
                {data?.collegeName || data?.userName || user?.userName || 'Welcome'}
              </h1>
              <p style={{ color:'#94a3b8', fontSize:13.5, margin:0 }}>
                <i className="fas fa-id-card" style={{ marginRight:6 }} />
                {user?.userLoginID} &nbsp;·&nbsp; Online Agriculture Diploma Admissions 2026
              </p>
            </div>
            {/* Progress ring */}
            <div style={{ textAlign:'center' }}>
              <div style={{ position:'relative', width:96, height:96, margin:'0 auto 8px' }}>
                <svg width={96} height={96} style={{ transform:'rotate(-90deg)' }}>
                  <circle cx={48} cy={48} r={40} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={8} />
                  <circle cx={48} cy={48} r={40} fill="none" stroke="#059669" strokeWidth={8}
                    strokeDasharray={`${admissionPct * 2.51} 251`} strokeLinecap="round" />
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ color:'#fff', fontWeight:800, fontSize:20, lineHeight:1 }}>{admissionPct}%</span>
                  <span style={{ color:'#94a3b8', fontSize:9, textTransform:'uppercase', letterSpacing:'.05em' }}>Filled</span>
                </div>
              </div>
              <p style={{ color:'#94a3b8', fontSize:11.5, margin:0 }}>Admission Progress</p>
            </div>
          </div>
        </div>

        {/* ── Stat Tiles ───────────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:28 }}>
          {tiles.map((t, i) => (
            <div key={i}
              style={{ background:t.gradient, borderRadius:20, padding:'24px 28px', boxShadow:`0 12px 40px ${t.shadow}`, color:'#fff', position:'relative', overflow:'hidden', transition:'transform .2s,box-shadow .2s', cursor:'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 20px 50px ${t.shadow}` }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.boxShadow=`0 12px 40px ${t.shadow}` }}>
              <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,.1)', pointerEvents:'none' }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ background:'rgba(255,255,255,.2)', width:52, height:52, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <i className={`fas ${t.icon}`} style={{ fontSize:22, color:'#fff' }} />
                  </div>
                  <div style={{ background:'rgba(255,255,255,.15)', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, letterSpacing:'.04em' }}>
                    {t.label.toUpperCase()}
                  </div>
                </div>
                <div style={{ fontSize:52, fontWeight:900, lineHeight:1, marginBottom:6 }}>{t.value}</div>
                <div style={{ fontSize:12, opacity:.8 }}>
                  {t.label === 'Total Intake' && 'Total seats available'}
                  {t.label === 'Admitted'     && `${admissionPct}% seats filled`}
                  {t.label === 'Vacancy'      && `${intake > 0 ? 100 - admissionPct : 0}% seats remaining`}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Session Details + Quick Actions ──────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>

          {/* Session Details — 2-column card grid matching screenshot */}
          <div style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.06)' }}>

            {/* Section header */}
            <div style={{ padding:'16px 22px', borderBottom:'2px solid #f1f5f9', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:4, height:20, borderRadius:99, background:'linear-gradient(180deg,#059669,#0ea5e9)' }} />
              <span style={{ fontWeight:700, fontSize:15, color:'#0f172a', letterSpacing:'-.01em' }}>Session Details</span>
              <span style={{ marginLeft:'auto', background:'#f0fdf4', color:'#166534', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, border:'1px solid #bbf7d0' }}>
                <i className="fas fa-circle" style={{ fontSize:6, marginRight:4, color:'#22c55e' }} />Active
              </span>
            </div>

            {/* 2-column card grid — exactly like candidate dashboard screenshot */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'#f1f5f9', padding:1 }}>
              {sessionFields.map((item, i) => (
                <div key={i}
                  style={{ background:'#fff', padding:'18px 22px', borderLeft:'3px solid transparent', transition:'all .2s ease', cursor:'default' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderLeftColor='#059669' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#fff';    e.currentTarget.style.borderLeftColor='transparent' }}>
                  {/* Label — small uppercase like screenshot */}
                  <p style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.12em', margin:'0 0 6px', fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
                    {item.label}
                  </p>
                  {/* Value — bold, large like screenshot */}
                  <p style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:0, fontFamily:"'Segoe UI',system-ui,sans-serif", letterSpacing:'-.01em', lineHeight:1.3 }}>
                    {item.value || '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.06)' }}>
            <div style={{ padding:'16px 22px', borderBottom:'2px solid #f1f5f9', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:4, height:20, borderRadius:99, background:'linear-gradient(180deg,#f59e0b,#f97316)' }} />
              <span style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>Quick Actions</span>
            </div>
            <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
              {quickActions.map((action, i) => (
                <button key={i} onClick={() => navigate(action.to)}
                  style={{ display:'flex', alignItems:'center', gap:14, width:'100%', background:'#f8fafc', border:`1.5px solid #f1f5f9`, borderRadius:14, padding:'14px 16px', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all .2s ease', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}
                  onMouseEnter={e => { e.currentTarget.style.background=`${action.color}12`; e.currentTarget.style.borderColor=`${action.color}40`; e.currentTarget.style.transform='translateX(4px)'; e.currentTarget.style.boxShadow=`0 6px 20px ${action.color}20` }}
                  onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#f1f5f9'; e.currentTarget.style.transform='translateX(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.04)' }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:`${action.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className={`fas ${action.icon}`} style={{ color:action.color, fontSize:16 }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:13.5, fontWeight:700, color:'#1e293b', fontFamily:"'Segoe UI',system-ui,sans-serif", display:'block' }}>{action.label}</span>
                    <span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>{action.sub}</span>
                  </div>
                  <div style={{ width:28, height:28, borderRadius:8, background:`${action.color}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <i className="fas fa-arrow-right" style={{ color:action.color, fontSize:11 }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
