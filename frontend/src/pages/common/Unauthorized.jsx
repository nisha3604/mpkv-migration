import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Unauthorized() {
  const navigate = useNavigate()
  const { user, isAdmin, isCollege, isCandidate } = useAuth()

  const goHome = () => {
    if (isAdmin)      navigate('/admin/dashboard')
    else if (isCollege)  navigate('/college/dashboard')
    else if (isCandidate) navigate('/candidate/dashboard')
    else navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '48px 40px', maxWidth: 420, width: '90%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Access Denied</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
          You don't have permission to access this page.
          {user && <><br />You are logged in as <strong>{user.userLoginID}</strong>.</>}
        </p>
        <button onClick={goHome}
          style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Go to My Dashboard
        </button>
      </div>
    </div>
  )
}
