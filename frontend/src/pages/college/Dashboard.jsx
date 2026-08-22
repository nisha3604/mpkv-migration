import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { collegeApi } from '../../services/api'

export default function CollegeDashboard() {
  const { user }              = useAuth()
  const navigate              = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    collegeApi.getDashboard()
      .then(res => setData(res.data.dashboard))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  const V = { navy: '#14212e', primary: '#059669', border: '#e2e8f0', bg: '#f5f6fa', textSecond: '#64748b' }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const tiles = [
    { label: 'Intake',   value: data?.intake   ?? 0, color: '#059669', bg: '#f0fdf4', icon: 'fa-graduation-cap' },
    { label: 'Admitted', value: data?.admitted  ?? 0, color: '#d97706', bg: '#fffbeb', icon: 'fa-user-check'      },
    { label: 'Vacancy',  value: data?.vacancy   ?? 0, color: '#db2777', bg: '#fdf2f8', icon: 'fa-chair'            },
  ]

  return (
    <div style={{ fontFamily: 'inherit', background: V.bg, minHeight: '100vh', padding: 24 }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Welcome banner */}
      <div style={{ background: V.navy, borderRadius: 12, padding: '20px 24px', marginBottom: 24, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Welcome</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{data?.userName || user?.userName || 'College'}</h2>
          <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0 0' }}>{user?.userLoginID}</p>
        </div>
        <button onClick={() => navigate('/college/summary')}
          style={{ background: V.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          View College Profile →
        </button>
      </div>

      {/* Stats tiles — mirrors DashboardCollege.aspx Intake/Admitted/Vacancy */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {tiles.map((t, i) => (
          <div key={i} style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 12, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`fas ${t.icon}`} style={{ color: t.color, fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: V.textSecond, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session details */}
      <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: V.navy, marginBottom: 16, borderLeft: '3px solid #059669', paddingLeft: 10, margin: '0 0 16px' }}>
          Session Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'User Login ID',       value: data?.userLoginID           || user?.userLoginID },
            { label: 'User Type',           value: data?.userType              || 'College' },
            { label: 'User Name',           value: data?.userName              || user?.userName },
            { label: 'Current Login Time',  value: data?.currentLoginDateTime  },
            { label: 'Last Login Time',     value: data?.lastLoginDateTime     || '—' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#f8fafc', border: `1px solid ${V.border}`, borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: V.textSecond, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px' }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{item.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
