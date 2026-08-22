// Copied from MpkvCandidate — exact same component
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function PublicLayout({ children }) {
  const [langActive, setLangActive] = useState('en')

  const navLinks = [
    { to: '/',               label: 'Home'           },
    { to: '/search-college', label: 'Search College' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 82, height: 82, borderRadius: '50%', border: '1px solid #e2e8f0', boxShadow: '0 6px 20px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', flexShrink: 0, overflow: 'hidden' }}>
              <img src="/MPKVLogo.png" alt="MPKV Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.3 }}>महात्मा फुले कृषि विद्यापीठ, राहुरी, अहिल्यानगर, महाराष्ट्र</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, margin: '2px 0' }}>Mahatma Phule Agriculture University</div>
              <div style={{ fontSize: 15, color: '#64748b' }}>Rahuri, Ahilyanagar, Maharashtra</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }} className="hidden md:block">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdfa', color: '#115e59', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 9999, border: '1px solid #ccfbf1' }}>
              <i className="fas fa-graduation-cap" /> ADMISSIONS PORTAL
            </span>
            <div style={{ fontSize: 14, color: '#334155', maxWidth: 300, textAlign: 'right', lineHeight: 1.5, marginTop: 6 }}>
              Online Agriculture Diploma / Polytechnic /<br />Mali Certificate Admissions - 2026
            </div>
          </div>
        </div>
      </header>

      <nav style={{ backgroundColor: '#14212e', padding: '0 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 40 }}>
        <ul style={{ display: 'flex', flexDirection: 'row', listStyle: 'none', margin: 0, padding: 0 }}>
          {navLinks.map(link => (
            <li key={link.to}>
              <Link to={link.to} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ffffff', textDecoration: 'none', fontSize: 16, fontWeight: 500, padding: '10px 16px', whiteSpace: 'nowrap', border: '1.5px solid transparent', borderRadius: 6, transition: 'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = '#1fa876' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: 3 }}>
            <button onClick={() => setLangActive('en')} style={{ background: langActive==='en'?'#059669':'transparent', border:'none', color: langActive==='en'?'#fff':'rgba(255,255,255,0.75)', fontSize:13, fontWeight:600, padding:'5px 11px', borderRadius:4, cursor:'pointer', fontFamily:'inherit' }}>EN</button>
            <button onClick={() => setLangActive('mr')} style={{ background: langActive==='mr'?'#059669':'transparent', border:'none', color: langActive==='mr'?'#fff':'rgba(255,255,255,0.75)', fontSize:13, fontWeight:600, padding:'5px 11px', borderRadius:4, cursor:'pointer', fontFamily:'inherit' }}>मराठी</button>
          </div>
          <Link to="/register" style={{ display:'flex', alignItems:'center', gap:8, backgroundColor:'#1fa876', color:'#ffffff', border:'none', padding:'10px 18px', borderRadius:6, fontSize:14, fontWeight:600, textDecoration:'none', whiteSpace:'nowrap', cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor='#178a5f'} onMouseLeave={e=>e.currentTarget.style.backgroundColor='#1fa876'}>
            + New Registration
          </Link>
          <Link to="/login" style={{ display:'flex', alignItems:'center', gap:8, backgroundColor:'transparent', color:'#ffffff', border:'1px solid rgba(255,255,255,0.4)', padding:'10px 18px', borderRadius:6, fontSize:14, fontWeight:600, textDecoration:'none', whiteSpace:'nowrap', cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'} onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
            Log In →
          </Link>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer style={{ background: '#0f172a', color: '#94a3b8' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: 40, padding: '48px 32px 40px', borderBottom: '1px solid #1e293b' }} className="footer-grid">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:40, height:40, background:'#1e293b', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <img src="/MPKVLogo.png" style={{ width:28 }} alt="MPKV" />
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#ffffff' }}>MPKV, Rahuri</div>
                <div style={{ fontSize:10, color:'#14b8a6', textTransform:'uppercase', letterSpacing:'0.05em' }}>Admissions Portal</div>
              </div>
            </div>
            <p style={{ fontSize:13, lineHeight:1.6 }}>Mahatma Phule Krishi Vidyapeeth<br />Rahuri, Ahilyanagar, Maharashtra - 413722</p>
          </div>
          <div>
            <h4 style={{ fontSize:14, fontWeight:600, color:'#ffffff', margin:'0 0 16px' }}>Information</h4>
            <ul style={{ listStyle:'none', padding:0, margin:0 }}>
              {['About University','Affiliated Colleges','Admission Rules','Fee Structure'].map(item => (
                <li key={item} style={{ marginBottom:10 }}><Link to="/about" style={{ fontSize:13, color:'#94a3b8', textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}><span style={{ color:'#14b8a6' }}>›</span> {item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize:14, fontWeight:600, color:'#ffffff', margin:'0 0 16px' }}>Legal</h4>
            <ul style={{ listStyle:'none', padding:0, margin:0 }}>
              {[{label:'Terms & Conditions',to:'/terms'},{label:'Privacy Policy',to:'/privacy'},{label:'Refund/Cancellation',to:'/refund'},{label:'Disclaimer',to:'/disclaimer'}].map(item => (
                <li key={item.to} style={{ marginBottom:10 }}><Link to={item.to} style={{ fontSize:13, color:'#94a3b8', textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}><span style={{ color:'#14b8a6' }}>›</span> {item.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize:14, fontWeight:600, color:'#ffffff', margin:'0 0 16px' }}>Technical Support</h4>
            <div style={{ background:'#1e293b', borderRadius:10, padding:16 }}>
              <div style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Helpline Number</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#ffffff', display:'flex', alignItems:'center', gap:8 }}><i className="fas fa-phone" style={{ color:'#14b8a6' }} /> +91-8806612998</div>
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>Working Hours</div>
                <div style={{ fontSize:12, color:'#ffffff', display:'flex', alignItems:'center', gap:6, marginTop:4 }}><i className="far fa-clock" style={{ color:'#14b8a6' }} /> 10:00 AM to 6:00 PM</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>(All Days Open)</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', justifyContent:'space-between', padding:'14px 32px', fontSize:13, color:'#475569', flexWrap:'wrap', gap:8 }}>
          <span>© 2026 Mahatma Phule Agriculture University. All rights reserved.</span>
          <span>Designed &amp; Developed for Admissions 2026</span>
        </div>
      </footer>
      <style>{`@media(max-width:900px){.footer-grid{grid-template-columns:1fr 1fr!important}}@media(max-width:560px){.footer-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
