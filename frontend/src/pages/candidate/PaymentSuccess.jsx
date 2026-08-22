import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { feeApi } from '../../services/api'

/**
 * Payment Success — mirrors PaymentSuccess.aspx
 * Reads query params: txId, refNo, amount
 * Verifies with backend → shows receipt details → link to summary
 */
export default function PaymentSuccess() {
  const navigate             = useNavigate()
  const [searchParams]       = useSearchParams()
  const [info,     setInfo]  = useState(null)
  const [loading,  setLoading] = useState(true)

  const txId   = searchParams.get('txId')   || ''
  const refNo  = searchParams.get('refNo')  || ''
  const amount = searchParams.get('amount') || ''

  useEffect(() => {
    feeApi.getPaymentSuccess(txId, refNo, amount)
      .then(res => setInfo(res.data))
      .catch(() => setInfo({ success: false, message: 'Could not verify payment.' }))
      .finally(() => setLoading(false))
  }, [txId])

  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', textSecond:'#64748b', bg:'#f5f6fa' }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:'#64748b', fontSize:14 }}>Verifying payment...</p>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:16, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', width:'100%', maxWidth:520, overflow:'hidden' }}>

        {/* header */}
        <div style={{ background:V.navy, padding:'20px 24px', textAlign:'center' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(5,150,105,0.2)', margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="fas fa-check-circle" style={{ color:'#34d399', fontSize:32 }}/>
          </div>
          <h2 style={{ color:'#fff', fontWeight:700, fontSize:20, margin:0 }}>Payment Successful!</h2>
          <p style={{ color:'#94a3b8', fontSize:13, margin:'6px 0 0' }}>Your application fee has been received.</p>
        </div>

        {/* receipt details */}
        <div style={{ padding:'24px' }}>
          {[
            { label:'Transaction ID',   value: info?.transactionID  || txId  || '—' },
            { label:'Bank Reference No',value: info?.bankReferenceNo || refNo || '—' },
            { label:'Amount Paid',      value: info?.feeAmount ? `₹ ${info.feeAmount}` : amount ? `₹ ${amount}` : '—' },
          ].map((row, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${V.border}` }}>
              <span style={{ fontSize:13, color:V.textSecond, fontWeight:500 }}>{row.label}</span>
              <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{row.value}</span>
            </div>
          ))}

          {/* note */}
          <div style={{ background:'#f0fdf9', border:'1px solid #ccfbf1', borderRadius:8, padding:'10px 14px', marginTop:16, fontSize:12.5, color:'#065f46', display:'flex', alignItems:'flex-start', gap:8 }}>
            <i className="fas fa-info-circle" style={{ marginTop:2, flexShrink:0 }}/>
            Payment receipt will be available in your payment history. Please proceed to complete your application.
          </div>

          {/* actions */}
          <div style={{ display:'flex', gap:12, marginTop:20 }}>
            <button
              onClick={() => navigate('/candidate/summary')}
              style={{ flex:1, background:V.primary, color:'#fff', border:'none', padding:'11px 0', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Continue to Summary →
            </button>
          </div>
          <div style={{ textAlign:'center', marginTop:10 }}>
            <button
              onClick={() => navigate('/candidate/fee')}
              style={{ background:'transparent', color:V.textSecond, border:'none', fontSize:12.5, cursor:'pointer', fontFamily:'inherit', textDecoration:'underline' }}>
              ← Back to Fee Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
