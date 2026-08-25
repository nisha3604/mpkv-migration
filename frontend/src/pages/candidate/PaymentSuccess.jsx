import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { feeApi } from '../../services/api'

/**
 * Payment Success page — gateway redirects browser here after successful payment.
 * URL: /payment-success?txId=...&refNo=...&amount=...
 *
 * Shows:
 *  - Big green success banner
 *  - Receipt details (Transaction ID, Reference No, Amount)
 *  - Auto-redirects to /candidate/fee after 5 seconds
 *    (fee page will then show "Payment Successful" highlight banner
 *     because DB now has remainingFee=0)
 *  - Manual "Continue" button
 */
export default function PaymentSuccess() {
  const navigate         = useNavigate()
  const [searchParams]   = useSearchParams()
  const [info, setInfo]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(5)

  const txId   = searchParams.get('txId')   || ''
  const refNo  = searchParams.get('refNo')  || ''
  const amount = searchParams.get('amount') || ''

  // Verify payment with backend
  useEffect(() => {
    feeApi.getPaymentSuccess(txId, refNo, amount)
      .then(res => setInfo(res.data))
      .catch(() => setInfo({ success: false, message: 'Could not verify payment. Please return to fee page.' }))
      .finally(() => setLoading(false))
  }, [txId])

  // Auto-redirect countdown — goes to /candidate/fee so the fee page
  // reloads fresh from DB and shows the "Payment Successful" banner
  useEffect(() => {
    if (loading) return
    if (countdown <= 0) {
      navigate('/candidate/fee')
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [loading, countdown])

  const V = {
    navy:    '#14212e',
    primary: '#059669',
    border:  '#e2e8f0',
    bg:      '#f5f6fa',
    textSecond: '#64748b',
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh', background:V.bg }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:'#64748b', fontSize:14 }}>Verifying payment...</p>
      </div>
    </div>
  )

  return (
    <div style={{
      fontFamily:'inherit', background:V.bg, minHeight:'100vh',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16
    }}>
      <div style={{
        background:'#fff', border:`1px solid ${V.border}`,
        borderRadius:16, boxShadow:'0 4px 24px rgba(0,0,0,0.08)',
        width:'100%', maxWidth:520, overflow:'hidden'
      }}>

        {/* ── Header — big success icon + title ───────────────────────── */}
        <div style={{ background:V.navy, padding:'28px 24px', textAlign:'center' }}>
          <div style={{
            width:72, height:72, borderRadius:'50%',
            background:'rgba(5,150,105,0.2)',
            margin:'0 auto 14px',
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'3px solid rgba(52,211,153,0.4)'
          }}>
            <i className="fas fa-check-circle" style={{ color:'#34d399', fontSize:36 }}/>
          </div>
          <h2 style={{ color:'#fff', fontWeight:700, fontSize:22, margin:'0 0 6px' }}>
            Payment Successful!
          </h2>
          <p style={{ color:'#94a3b8', fontSize:13, margin:0 }}>
            Your application fee has been received.
          </p>
        </div>

        {/* ── Receipt ──────────────────────────────────────────────────── */}
        <div style={{ padding:'24px' }}>

          {/* receipt rows */}
          <div style={{ border:`1px solid ${V.border}`, borderRadius:10, overflow:'hidden', marginBottom:20 }}>
            {[
              { label:'Transaction ID',    value: info?.transactionID   || txId   || '—' },
              { label:'Bank Reference No', value: info?.bankReferenceNo || refNo  || '—' },
              { label:'Amount Paid',       value: info?.feeAmount
                  ? `₹ ${info.feeAmount}`
                  : amount ? `₹ ${amount}` : '—' },
            ].map((row, i) => (
              <div key={i} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'12px 16px',
                borderTop: i > 0 ? `1px solid ${V.border}` : 'none',
                background: i % 2 === 0 ? '#fff' : '#f8fafc'
              }}>
                <span style={{ fontSize:13, color:V.textSecond, fontWeight:500 }}>{row.label}</span>
                <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* info note */}
          <div style={{
            background:'#f0fdf9', border:'1px solid #ccfbf1', borderRadius:8,
            padding:'10px 14px', marginBottom:20,
            fontSize:12.5, color:'#065f46',
            display:'flex', alignItems:'flex-start', gap:8
          }}>
            <i className="fas fa-info-circle" style={{ marginTop:2, flexShrink:0 }}/>
            Payment confirmed. You will be redirected to the fee page in{' '}
            <strong style={{ marginLeft:4, color:'#059669' }}>{countdown}s</strong>
          </div>

          {/* actions */}
          <button
            onClick={() => navigate('/candidate/fee')}
            style={{
              width:'100%', background:V.primary, color:'#fff',
              border:'none', padding:'12px 0', borderRadius:8,
              fontSize:14, fontWeight:600, cursor:'pointer',
              fontFamily:'inherit',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow:'0 0 15px rgba(5,150,105,0.3)'
            }}
            onMouseEnter={e => e.currentTarget.style.background='#047857'}
            onMouseLeave={e => e.currentTarget.style.background=V.primary}>
            <i className="fas fa-arrow-right"/> Continue to Fee Page
          </button>

        </div>
      </div>
    </div>
  )
}
