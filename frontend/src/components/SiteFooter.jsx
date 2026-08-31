import { Link } from 'react-router-dom'

/**
 * SiteFooter — shared footer matching the old project's footer layout exactly.
 *
 * Layout (3 columns):
 *   Col 1: Contact Us — address
 *   Col 2: Important Links — About Us | Terms & Conditions / Privacy Policy | Refund/Cancellation / Disclaimer
 *   Col 3: Helpdesk — Phone + Timing
 * Bottom bar: © MPKV, Rahuri + Designed by Analytica
 */
export default function SiteFooter() {
  return (
    <footer style={{ background: '#1e2a3a', color: '#a0aec0', fontFamily: 'inherit' }}>

      {/* ── Main 3-column section ────────────────────────────────────── */}
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr',
        gap: 40, padding: '28px 32px 24px',
        borderBottom: '1px solid #2d3d50'
      }} className="footer-cols">

        {/* Col 1 — Contact Us */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 12px', paddingBottom: 8, borderBottom: '1px solid #2d3d50' }}>
            Contact Us
          </h4>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: '#7b9ab2' }}>
            Mahatma Phule Krishi Vidyapeeth, Rahuri,<br />
            Ahilyanagar, Maharashtra - 413722
          </p>
        </div>

        {/* Col 2 — Important Links */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 12px', paddingBottom: 8, borderBottom: '1px solid #2d3d50' }}>
            Important Links
          </h4>
          {/* 2-column link grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
            {[
              { label: 'About Us',                to: '/about'     },
              { label: 'Terms & Conditions',      to: '/terms'     },
              { label: 'Privacy Policy',          to: '/privacy'   },
              { label: 'Refund / Cancellation Policy', to: '/refund' },
              { label: 'Disclaimer',              to: '/disclaimer'},
            ].map(link => (
              <Link key={link.to} to={link.to}
                style={{ fontSize: 13, color: '#7b9ab2', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1.8 }}
                onMouseEnter={e => e.currentTarget.style.color = '#63b3ed'}
                onMouseLeave={e => e.currentTarget.style.color = '#7b9ab2'}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Col 3 — Helpdesk */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 12px', paddingBottom: 8, borderBottom: '1px solid #2d3d50' }}>
            Helpdesk
          </h4>
          <p style={{ fontSize: 13, margin: '0 0 6px', color: '#a0aec0' }}>
            <span style={{ color: '#a0aec0' }}>Phone : </span>
            <strong style={{ color: '#fff' }}>+91-8806612998</strong>
          </p>
          <p style={{ fontSize: 13, margin: 0, color: '#a0aec0' }}>
            <span style={{ color: '#a0aec0' }}>Timing : </span>
            <strong style={{ color: '#fff' }}>10:00 am to 6:00 pm (All Days)</strong>
          </p>
        </div>

      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────── */}
      <div style={{
        background: '#16202e',
        padding: '10px 32px',
        textAlign: 'center',
        fontSize: 12,
        color: '#64748b',
        lineHeight: 1.7
      }}>
        <div>© MPKV, Rahuri. All Rights Reserved.</div>
        <div>
          Designed, Developed and Hosted by{' '}
          <strong style={{ color: '#7b9ab2' }}>Analytica Business Solutions (ABS)</strong>
        </div>
      </div>

      <style>{`
        @media(max-width: 768px) {
          .footer-cols { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </footer>
  )
}
