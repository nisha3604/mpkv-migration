import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { eVerificationApi } from '../../services/api'

/**
 * EVerification Dashboard — mirrors DashboardEVerification.aspx
 * SP: Dashboard_GetEVerificationDashboard(@UserID)
 * Shows: Total, FullyVerified, PartiallyVerified, NotAssigned, NotVerified, ReUploaded
 * UserTypeID 41 (supervisor) also sees "Not Assigned" stat and can access unassigned candidates
 */
export default function EVDashboard() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    eVerificationApi.getDashboard()
      .then(r => { if (r.data?.success) setData(r.data); else setError(r.data?.message || 'Failed to load.') })
      .catch(e => { if (e.response?.status === 401) { logout(); navigate('/login') } else setError('Server error.') })
      .finally(() => setLoading(false))
  }, [])

  const V = { navy:'#14212e', border:'#e2e8f0', bg:'#f5f6fa', muted:'#64748b' }

  const STATS = [
    { label:'Total Candidates',    key:'total',             icon:'fa-users',         color:'#2563eb', bg:'#eff6ff' },
    { label:'Fully Verified',      key:'fullyVerified',     icon:'fa-check-double',  color:'#059669', bg:'#f0fdf4' },
    { label:'Partially Verified',  key:'partiallyVerified', icon:'fa-check',         color:'#d97706', bg:'#fffbeb' },
    { label:'Not Verified',        key:'notVerified',       icon:'fa-times-circle',  color:'#dc2626', bg:'#fef2f2' },
    { label:'Re-Uploaded',         key:'reUploaded',        icon:'fa-upload',        color:'#7c3aed', bg:'#f5f3ff' },
  ]

  if (data?.isEVCSupervisor) {
    STATS.splice(4, 0, { label:'Not Assigned', key:'notAssigned', icon:'fa-user-clock', color:'#0891b2', bg:'#ecfeff' })
  }

  const STATUS_LINKS = [
    { label:'Not Verified',       status:'N', color:'#dc2626', icon:'fa-times-circle'   },
    { label:'Partially Verified', status:'R', color:'#d97706', icon:'fa-adjust'         },
    { label:'Fully Verified',     status:'F', color:'#059669', icon:'fa-check-double'   },
    { label:'Re-Uploaded',        status:'P', color:'#7c3aed', icon:'fa-upload'         },
    ...(data?.isEVCSupervisor ? [{ label:'Not Assigned', status:'A', color:'#0891b2', icon:'fa-user-clock' }] : []),
  ]

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:24 }}>

      {/* Header */}
      <div style={{ background:V.navy, borderRadius:12, padding:'20px 24px', marginBottom:24, color:'#fff' }}>
        <p style={{ fontSize:11, color:'#94a3b8', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'.06em' }}>
          e-Verification Dashboard
        </p>
        <h2 style={{ fontSize:20, fontWeight:800, margin:0 }}>
          Welcome, {data?.userName || user?.userName || 'EVC Coordinator'}
        </h2>
        <p style={{ fontSize:12, color:'#cbd5e1', margin:'4px 0 0' }}>
          Login ID: {data?.userLoginID || user?.userLoginID}
          &nbsp;·&nbsp;
          {data?.userType}
        </p>
      </div>

      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:20, fontSize:13 }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight:6 }} />{error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${STATS.length},1fr)`, gap:14, marginBottom:28 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ background:s.bg, border:`1px solid ${s.color}22`, borderRadius:12, padding:'18px 16px' }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`${s.color}20`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
              <i className={`fas ${s.icon}`} style={{ color:s.color, fontSize:15 }} />
            </div>
            <div style={{ fontSize:28, fontWeight:900, color:'#0f172a', lineHeight:1 }}>{data?.[s.key] ?? '0'}</div>
            <div style={{ fontSize:11, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'.07em', marginTop:6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div style={{ background:'#fff', borderRadius:12, border:`1px solid ${V.border}`, overflow:'hidden' }}>
        <div style={{ background:V.navy, padding:'10px 18px' }}>
          <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14 }}>Verify Documents by Status</h5>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, padding:18 }}>
          {STATUS_LINKS.map((s, i) => (
            <button key={i}
              onClick={() => navigate(`/everification/candidates?status=${s.status}`)}
              style={{ background:'#f8fafc', border:`1.5px solid ${V.border}`, borderRadius:12, padding:'16px 14px', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all .18s' }}
              onMouseEnter={e => { e.currentTarget.style.background=`${s.color}10`; e.currentTarget.style.borderColor=`${s.color}50`; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor=V.border; e.currentTarget.style.transform='none' }}>
              <i className={`fas ${s.icon}`} style={{ color:s.color, fontSize:18, display:'block', marginBottom:8 }} />
              <div style={{ fontSize:13.5, fontWeight:700, color:'#0f172a' }}>{s.label}</div>
              <div style={{ fontSize:11.5, color:V.muted, marginTop:3 }}>View candidate list</div>
            </button>
          ))}
          {/* Verify by Application ID */}
          <button
            onClick={() => navigate('/everification/check')}
            style={{ background:'#f8fafc', border:`1.5px solid ${V.border}`, borderRadius:12, padding:'16px 14px', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all .18s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.borderColor='#059669'; e.currentTarget.style.transform='translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor=V.border; e.currentTarget.style.transform='none' }}>
            <i className="fas fa-search" style={{ color:'#059669', fontSize:18, display:'block', marginBottom:8 }} />
            <div style={{ fontSize:13.5, fontWeight:700, color:'#0f172a' }}>Verify by Application ID</div>
            <div style={{ fontSize:11.5, color:V.muted, marginTop:3 }}>Search & verify a specific candidate</div>
          </button>
        </div>
      </div>

    </div>
  )
}
