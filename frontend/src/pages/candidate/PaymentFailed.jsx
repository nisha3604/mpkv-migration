import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * Payment Failed — mirrors PaymentFailed.aspx
 * Reads query params: msg
 * Shows error + retry button back to fee page
 */
export default function PaymentFailed() {
  const navigate         = useNavigate()
  const [searchParams]   = useSearchParams()
  const failedMsg        = searchParams.get('msg') || 'Your payment could not be processed. Please try again.'

  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', textSecond:'#64748b', bg:'#f5f6fa' }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:16, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', width:'100%', maxWidth:480, overflow:'hidden' }}>

        {/* header */}
        <div style={{ background:V.navy, padding:'20px 24px', textAlign:'center' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(239,68,68,0.15)', margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="fas fa-times-circle" style={{ color:'#f87171', fontSize:32 }}/>
          </div>
          <h2 style={{ color:'#fff', fontWeight:700, fontSize:20, margin:0 }}>Payment Failed</h2>
          <p style={{ color:'#94a3b8', fontSize:13, margin:'6px 0 0' }}>Your payment could not be completed.</p>
        </div>

        {/* body */}
        <div style={{ padding:'24px' }}>
          {/* error message box */}
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:13.5, color:'#dc2626', display:'flex', alignItems:'flex-start', gap:8 }}>
            <i className="fas fa-exclamation-circle" style={{ marginTop:2, flexShrink:0 }}/>
            <span>{decodeURIComponent(failedMsg)}</span>
          </div>

          {/* yellow warning note — same as old aspx */}
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:12.5, color:'#92400e', display:'flex', alignItems:'flex-start', gap:8 }}>
            <i className="fas fa-exclamation-triangle" style={{ color:'#f59e0b', marginTop:2, flexShrink:0 }}/>
            <span>
              If the amount has been deducted from your account, please wait <strong>30 minutes</strong> and
              revisit the fee page. The system will automatically detect your payment status. Do not attempt payment again.
            </span>
          </div>

          {/* actions */}
          <div style={{ display:'flex', gap:12 }}>
            <button
              onClick={() => navigate('/candidate/fee')}
              style={{ flex:1, background:V.primary, color:'#fff', border:'none', padding:'11px 0', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              <i className="fas fa-redo" style={{ marginRight:6 }}/>Try Again
            </button>
          </div>
          <div style={{ textAlign:'center', marginTop:10 }}>
            <button
              onClick={() => navigate('/candidate/dashboard')}
              style={{ background:'transparent', color:V.textSecond, border:'none', fontSize:12.5, cursor:'pointer', fontFamily:'inherit', textDecoration:'underline' }}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
