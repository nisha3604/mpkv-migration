import { useNavigate, useLocation } from 'react-router-dom'

/**
 * MenuHome — mirrors Menu/MenuHome.aspx
 * Theme: new project navy/green palette
 * Functionality: 3 navigation buttons (Manage Links | Manage Groups | Manage Menus)
 */

// Shared top-nav buttons — exported so all 3 sub-pages can import & reuse
export function MenuTopNav({ active }) {
  const navigate = useNavigate()
  const tabs = [
    { label: 'Manage Links',  to: '/admin/menu/links'  },
    { label: 'Manage Groups', to: '/admin/menu/groups' },
    { label: 'Manage Menus',  to: '/admin/menu/menus'  },
  ]
  return (
    <div style={{ textAlign:'center', marginBottom:20 }}>
      {tabs.map(t => (
        <button key={t.to} onClick={() => navigate(t.to)}
          style={{
            margin:'0 6px', padding:'8px 22px', fontSize:14, fontWeight:600,
            border:'none', borderRadius:7, cursor:'pointer', fontFamily:'inherit',
            background: active === t.label ? '#059669' : '#475569',
            color: '#fff',
            boxShadow: active === t.label ? '0 3px 10px rgba(5,150,105,.4)' : '0 2px 6px rgba(0,0,0,.15)',
            transition:'all .15s',
          }}
          onMouseEnter={e => { if(active!==t.label) e.currentTarget.style.background='#334155' }}
          onMouseLeave={e => { if(active!==t.label) e.currentTarget.style.background='#475569' }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default function MenuHome() {
  return (
    <div style={{ fontFamily:'inherit', background:'#f1f5f9', minHeight:'100vh', padding:24 }}>
      <PageHeader title="Menu Management" />
      <div style={{ background:'#fff', borderRadius:'0 0 12px 12px', border:'1px solid #e2e8f0', borderTop:'none', padding:32 }}>
        <MenuTopNav active={null} />
      </div>
    </div>
  )
}

// Shared page header — navy bar with title
export function PageHeader({ title }) {
  return (
    <div style={{ background:'#14212e', borderRadius:'12px 12px 0 0', padding:'12px 20px' }}>
      <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{title}</span>
    </div>
  )
}
