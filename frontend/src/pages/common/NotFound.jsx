import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '48px 40px', maxWidth: 420, width: '90%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>404</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Page Not Found</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/" style={{ background: '#059669', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '11px 28px', fontSize: 14, fontWeight: 600, display: 'inline-block' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
