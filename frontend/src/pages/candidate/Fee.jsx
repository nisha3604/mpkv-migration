import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * Pay Application Fee — mirrors PayApplicationFee.aspx
 *
 * Flow:
 *  1. On load → GET /api/applicationform/fee
 *     - CheckFailedTransactions happens server-side on page load
 *  2. If FeeToBePaid == 0 → show "NO FEES (Payment Exempted)" + Proceed button
 *  3. If RemainingFee == 0 (already paid) → show "Already Paid" + Proceed button
 *  4. If RemainingFee > 0 → show payment gateway radio buttons + Pay button
 *  5. On Pay → POST /api/applicationform/fee/initiate → get PaymentGatewayURL → redirect
 *  6. On Proceed (fee=0 or already paid) → POST /api/applicationform/fee/proceed → navigate to summary
 */
export default function Fee() {
  const navigate    = useNavigate()
  const { user }    = useAuth()

  const [fee,          setFee]          = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [selectedGW,   setSelectedGW]   = useState(0)
  const [paying,       setPaying]       = useState(false)
  const [proceeding,   setProceeding]   = useState(false)
  const [gwError,      setGwError]      = useState('')

  // ── Load fee details ────────────────────────────────────────────────────────
  useEffect(() => {
    applicationFormApi.getFeeDetails()
      .then(res => {
        setFee(res.data.fee)
        // Auto-select gateway if only one option
        if (res.data.fee?.paymentGateways?.length === 1)
          setSelectedGW(res.data.fee.paymentGateways[0].paymentGatewayID)
      })
      .catch(err => {
        const msg = err.response?.data?.message ?? err.message ?? 'Failed to load fee details.'
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Proceed (fee = 0 or already paid) ────────────────────────────────────────
  const handleProceed = async () => {
    setProceeding(true); setError('')
    try {
      const res = await applicationFormApi.proceedFee()
      if (res.data.success) navigate('/candidate/summary')
      else setError(res.data.message || 'Failed to proceed.')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to proceed.')
    } finally { setProceeding(false) }
  }

  // ── Pay (gateway redirect) ────────────────────────────────────────────────
  const handlePay = async () => {
    if (!selectedGW) { setGwError('Please select a payment gateway.'); return }
    setPaying(true); setGwError(''); setError('')
    try {
      const res = await applicationFormApi.initiateFee(selectedGW)
      if (res.data.success && res.data.paymentGatewayURL) {
        // Redirect browser to payment gateway (same as old code's Response.Redirect)
        window.location.href = res.data.paymentGatewayURL
      } else {
        setError(res.data.message || 'Failed to initiate payment.')
        setPaying(false)
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to initiate payment.')
      setPaying(false)
    }
  }

  const V = {
    navy:'#14212e', primary:'#059669', primaryDark:'#047857',
    teal:'#0d9488', tealLight:'#f0fdfb', tealBorder:'#ccfbf1',
    border:'#e2e8f0', borderLight:'#f1f5f9',
    textPrimary:'#0f172a', textSecond:'#64748b', textLight:'#94a3b8',
    danger:'#ef4444', bg:'#f5f6fa', amber:'#f59e0b',
  }

  const steps = [
    { label:'Application Form',               done:true,  active:false },
    { label:'College Selection & Preference', done:true,  active:false },
    { label:'Documents Upload',               done:true,  active:false },
    { label:'Fee Payment',                    done:false, active:true  },
    { label:'Lock Form',                      done:false, active:false },
  ]

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:'#64748b', fontSize:14 }}>Loading Fee Details...</p>
      </div>
    </div>
  )

  // Fee state flags
  const feeToBePaid  = fee?.feeToBePaid  ?? 0
  const remainingFee = fee?.remainingFee ?? 0
  const isFeeExempt  = feeToBePaid === 0
  const isAlreadyPaid = feeToBePaid > 0 && remainingFee <= 0
  const showPay      = feeToBePaid > 0 && remainingFee > 0

  const labelStyle = { fontSize:12, fontWeight:600, color:V.textSecond, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }
  const valueStyle = { fontSize:14, fontWeight:600, color:V.textPrimary }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', paddingBottom:40 }}>

      {/* top info bar */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${V.border}`, padding:'10px 24px', display:'flex', alignItems:'center', gap:32 }}>
        <span style={{ fontSize:12, color:V.textSecond, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Application ID</span>
        <span style={{ fontSize:15, fontWeight:700, color:V.primary }}>{user?.userLoginID || '—'}</span>
      </div>

      {/* step-bar */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'20px 24px 0', flexWrap:'wrap' }}>
        {steps.map((s,i,arr) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, fontSize:12.5, fontWeight:600,
              background:s.active?V.primary:s.done?V.tealLight:V.borderLight,
              color:s.active?'#fff':s.done?V.teal:V.textSecond,
              border:`1px solid ${s.active?V.primary:s.done?V.tealBorder:V.border}` }}>
              {s.done   && <i className="fas fa-check"  style={{ fontSize:9 }}/>}
              {s.active && <i className="fas fa-circle" style={{ fontSize:8 }}/>}
              {s.label}
            </div>
            {i < arr.length-1 && <span style={{ color:V.textLight, fontSize:12 }}>›</span>}
          </div>
        ))}
      </div>

      <div style={{ padding:'20px 24px 24px' }}>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle"/> {error}
          </div>
        )}

        {/* ── Pay Card ─────────────────────────────────────────────────── */}
        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* header */}
          <div style={{ background:V.navy, padding:'16px 24px' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>Pay Application Fee</h3>
          </div>

          <div style={{ padding:'24px' }}>

            {/* ── Personal Details section ─────────────────────────────── */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                <i className="fas fa-user"/> Candidate Details
              </div>
              {/* Applied Course — full width */}
              <div style={{ background:V.tealLight, border:`1px solid ${V.tealBorder}`, borderRadius:10, padding:'10px 16px', marginBottom:12 }}>
                <div style={labelStyle}>Applied Course</div>
                <div style={{ ...valueStyle, fontSize:15 }}>{fee?.appliedCourse || '—'}</div>
              </div>
              {/* 2-column grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { label:'Candidate Name', value: fee?.candidateName },
                  { label:'Gender',         value: fee?.gender },
                  { label:'Category',       value: fee?.category },
                  { label:'Is PWD',         value: fee?.isPWD },
                ].map((item, i) => (
                  <div key={i} style={{ background:'#f8fafc', border:`1px solid ${V.borderLight}`, borderRadius:8, padding:'10px 14px' }}>
                    <div style={labelStyle}>{item.label}</div>
                    <div style={valueStyle}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Fee Details section ──────────────────────────────────── */}
            <div style={{ borderTop:`1px solid ${V.borderLight}`, paddingTop:20, marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                <i className="fas fa-rupee-sign"/> Online Application Fee Details
              </div>

              {/* Fee amount box */}
              <div style={{ background: isFeeExempt ? '#f0fdf9' : '#fff7ed', border:`1px solid ${isFeeExempt?V.tealBorder:'#fed7aa'}`, borderRadius:10, padding:'14px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background: isFeeExempt?V.tealLight:'#fff7ed', border:`1px solid ${isFeeExempt?V.tealBorder:'#fed7aa'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className="fas fa-rupee-sign" style={{ color: isFeeExempt?V.teal:'#ea580c', fontSize:18 }}/>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:V.textSecond, marginBottom:2 }}>Application Fee</div>
                  {isFeeExempt
                    ? <div style={{ fontSize:16, fontWeight:700, color:V.teal }}>NO FEES (Payment Exempted)</div>
                    : isAlreadyPaid
                      ? <>
                          <div style={{ fontSize:16, fontWeight:700, color:V.primary }}>&#8377; {feeToBePaid}/- <span style={{ fontSize:12, fontWeight:500, color:V.textSecond }}>(Already Paid)</span></div>
                        </>
                      : <div style={{ fontSize:20, fontWeight:700, color:'#ea580c' }}>&#8377; {remainingFee}/-</div>
                  }
                </div>
              </div>

              {/* Gateway selector — only shown when fee > 0 and remaining > 0 */}
              {showPay && fee?.paymentGateways?.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:V.textPrimary, marginBottom:10 }}>
                    Select Payment Gateway <span style={{ color:V.danger }}>*</span>
                  </div>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    {fee.paymentGateways.map(gw => (
                      <label key={gw.paymentGatewayID}
                        style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:8, border:`1.5px solid ${selectedGW===gw.paymentGatewayID?V.primary:V.border}`, background:selectedGW===gw.paymentGatewayID?'#f0fdf9':'#fff', cursor:'pointer', fontSize:14, fontWeight:600, color:selectedGW===gw.paymentGatewayID?V.primary:V.textPrimary, transition:'all .15s' }}>
                        <input type="radio" name="gateway" value={gw.paymentGatewayID}
                          checked={selectedGW===gw.paymentGatewayID}
                          onChange={() => { setSelectedGW(gw.paymentGatewayID); setGwError('') }}
                          style={{ accentColor:V.primary }}/>
                        {gw.paymentGatewayName}
                      </label>
                    ))}
                  </div>
                  {gwError && (
                    <p style={{ fontSize:12.5, color:V.danger, margin:'6px 0 0', display:'flex', alignItems:'center', gap:4 }}>
                      <i className="fas fa-exclamation-circle"/> {gwError}
                    </p>
                  )}
                </div>
              )}

              {/* ── Yellow Note Box — same as old aspx ─────────────────── */}
              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 16px', display:'flex', alignItems:'flex-start', gap:8, fontSize:12.5, color:'#92400e' }}>
                <i className="fas fa-exclamation-triangle" style={{ color:V.amber, marginTop:2, flexShrink:0 }}/>
                <span>
                  <strong>Important:</strong> If payment amount is deducted from your bank/card account but not confirmed here,
                  please wait <strong>30 minutes</strong> and then re-open this page. Do not attempt payment again during this period.
                </span>
              </div>
            </div>
          </div>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderTop:`1px solid ${V.borderLight}`, background:'#f8fafc', borderRadius:'0 0 14px 14px', flexWrap:'wrap', gap:12 }}>
            <div style={{ flex:1 }}/>

            <div style={{ display:'flex', gap:10, position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
              <button type="button"
                onClick={() => navigate('/candidate/documents')}
                style={{ background:'transparent', color:V.textPrimary, border:`1.5px solid ${V.border}`, padding:'9px 20px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>
                <i className="fas fa-arrow-left"/> Back
              </button>

              {/* Proceed button — fee=0 or already paid */}
              {(isFeeExempt || isAlreadyPaid) && (
                <button type="button"
                  onClick={handleProceed}
                  disabled={proceeding}
                  style={{ background:proceeding?'#d1fae5':V.primary, color:proceeding?'#6b7280':'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:proceeding?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}
                  onMouseEnter={e => { if(!proceeding) e.currentTarget.style.background=V.primaryDark }}
                  onMouseLeave={e => { if(!proceeding) e.currentTarget.style.background=V.primary }}>
                  {proceeding
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                    : <>Save &amp; Next &#8594;</>}
                </button>
              )}

              {/* Pay button — fee > 0 */}
              {showPay && (
                <button type="button"
                  onClick={handlePay}
                  disabled={paying}
                  style={{ background:paying?'#6b7280':V.primary, color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:paying?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}
                  onMouseEnter={e => { if(!paying) e.currentTarget.style.background=V.primaryDark }}
                  onMouseLeave={e => { if(!paying) e.currentTarget.style.background=V.primary }}>
                  {paying
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Redirecting to Gateway...</>
                    : <><i className="fas fa-play-circle"/> Proceed to Payment</>}
                </button>
              )}
            </div>
            <div style={{ flex:1 }}/>
          </div>
        </div>
      </div>

      {/* scroll-to-top */}
      <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
        style={{ position:'fixed', bottom:28, right:28, width:44, height:44, borderRadius:'50%', background:'#f97316', color:'#fff', border:'none', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(249,115,22,0.4)', zIndex:50 }}>
        <i className="fas fa-chevron-up"/>
      </button>
    </div>
  )
}
