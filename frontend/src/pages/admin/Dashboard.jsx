import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', bg:'#f5f6fa', textSecond:'#64748b' }

  const links = [
    { label:'College List',           icon:'fa-list',          to:'/admin/college/list',           desc:'Search and manage all colleges',          color:'#059669' },
    { label:'College Passwords',      icon:'fa-key',           to:'/admin/college/passwords',       desc:'View and send college login passwords',    color:'#0ea5e9' },
    { label:'Reset College Password', icon:'fa-lock-open',     to:'/admin/college/reset-password',  desc:'Reset a college user password',           color:'#f59e0b' },
    { label:'Manage Menu',            icon:'fa-bars',          to:'/admin/menu',                    desc:'Add/edit/delete navigation menu items',   color:'#7c3aed' },
    { label:'Manage Notifications',   icon:'fa-bell',          to:'/admin/notifications',           desc:'Control home page content — news, downloads, announcements', color:'#dc2626' },
    { label:'Activity Status',        icon:'fa-calendar-alt',  to:'/admin/activity-status',         desc:'Open/close registration, form filling, fee payment windows',  color:'#0ea5e9' },
    { label:'Admission Schedule',     icon:'fa-calendar-check',to:'/admin/admission-schedule',      desc:'Set per-round allotment display + admission date windows',     color:'#059669' },  ]

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ background:V.navy, borderRadius:12, padding:'20px 24px', marginBottom:24, color:'#fff' }}>
        <p style={{ fontSize:12, color:'#94a3b8', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Admin Dashboard</p>
        <h2 style={{ fontSize:20, fontWeight:700, margin:0 }}>Welcome, {user?.userName || 'Administrator'}</h2>
        <p style={{ fontSize:12, color:'#cbd5e1', margin:'4px 0 0' }}>Login ID: {user?.userLoginID}</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {links.map((l,i) => (
          <button key={i} onClick={() => navigate(l.to)}
            style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:12, padding:24, cursor:'pointer', textAlign:'left', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', fontFamily:'inherit', transition:'box-shadow .15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.12)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'}>
            <div style={{ width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, background: l.color+'18' }}>
              <i className={`fas ${l.icon}`} style={{ color: l.color, fontSize:18 }} />
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:'#0f172a', marginBottom:4 }}>{l.label}</div>
            <div style={{ fontSize:13, color:V.textSecond }}>{l.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
