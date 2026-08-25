import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * Pay Application Fee — exact mirror of PayApplicationFee.aspx
 *
 * Flow (same as old project):
 *  1. Load  → GET /api/applicationform/fee → fills candidate + fee details
 *  2. If FeeToBePaid == 0     → "NO FEES" label + Save & Next button
 *  3. If RemainingFee == 0    → "Already Paid" label + Save & Next button
 *  4. If RemainingFee > 0     → fee amount + gateway selector + Proceed to Payment button
 *  5. Pay click               → POST /api/applicationform/fee/initiate
 *                             → window.location.href = PaymentGatewayURL  (same as old Response.Redirect)
 *  6. Proceed click           → POST /api/applicationform/fee/proceed → navigate /candidate/summary
 */
export default function Fee() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [fee,        setFee]        = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [selectedGW, setSelectedGW] = useState(0)
  const [gwError,    setGwError]    = useState('')
  const [paying,     setPaying]     = useState(false)
  const [proceeding, setProceeding] = useState(false)

  // ── Load fee details on mount ─────────────────────────────────────────────
  useEffect(() => {
    applicationFormApi.getFeeDetails()
      .then(res => {
        const f = res.data.fee
        setFee(f)
        // Auto-select if only one gateway (mirrors rbnlstPaymentGateway auto-select)
        if (f?.paymentGateways?.length === 1)
          setSelectedGW(f.paymentGateways[0].paymentGatewayID)
      })
      .catch(err => {
        setError(err.response?.data?.message ?? 'Failed to load fee details. Please refresh.')
      })
      .finally(() => setLoading(false))
  }, [])

  // ── btnProceed_Click (fee = 0 or already paid) ────────────────────────────
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

  // ── btnPay_Click → Response.Redirect(PaymentGatewayURL) ──────────────────
  const handlePay = async () => {
    if (!selectedGW) { setGwError('Please Select Payment Gateway.'); return }
    setPaying(true); setGwError(''); setError('')
    try {
      const res = await applicationFormApi.initiateFee(selectedGW)
      if (res.data.success && res.data.paymentGatewayURL) {
        // Exact mirror of: Response.Redirect(entity.PaymentGatewayURL + "?T1=..." + "&T2=...")
        window.location.href = res.data.paymentGatewayURL
      } else {
        setError(res.data.message || 'Failed to initiate payment.')
        setPaying(false)
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to initiate payment. Please try again.')
      setPaying(false)
    }
  }

  // ── CSS tokens ────────────────────────────────────────────────────────────
  const V = {
    navy:        '#14212e',
    primary:     '#059669',
    primaryDark: '#047857',
    teal:        '#0d9488',
    tealLight:   '#f0fdfb',
    tealBorder:  '#ccfbf1',
    border:      '#e2e8f0',
    borderLight: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecond:  '#64748b',
    textLight:   '#94a3b8',
    danger:      '#ef4444',
    bg:          '#f5f6fa',
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

  // ── Fee state flags (mirrors old GetApplicationFee logic) ─────────────────
  const feeToBePaid  = fee?.feeToBePaid  ?? 0
  const remainingFee = fee?.remainingFee ?? 0
  const isFeeExempt  = feeToBePaid === 0
  const isAlreadyPaid = feeToBePaid > 0 && remainingFee <= 0
  const showPay      = feeToBePaid > 0 && remainingFee > 0
  // btnProceed visible when fee=0 or already paid; btnPay visible when remaining>0
  const showProceed  = isFeeExempt || isAlreadyPaid

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', paddingBottom:40 }}>

      {/* top info bar */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${V.border}`, padding:'10px 24px', display:'flex', alignItems:'center', flexWrap:'wrap', gap:'6px 32px' }}>
        <span style={{ fontSize:12, color:V.textSecond, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Application ID</span>
        <span style={{ fontSize:15, fontWeight:700, color:V.primary }}>{user?.userLoginID || '—'}</span>
      </div>

      {/* step bar */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'20px 24px 0', flexWrap:'wrap' }}>
        {steps.map((s,i,arr) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, fontSize:12.5, fontWeight:600,
              background:s.active ? V.primary : s.done ? V.tealLight : V.borderLight,
              color:s.active ? '#fff' : s.done ? V.teal : V.textSecond,
              border:`1px solid ${s.active ? V.primary : s.done ? V.tealBorder : V.border}` }}>
              {s.done && !s.active && <i className="fas fa-check" style={{ fontSize:9 }}/>}
              {s.active && <i className="fas fa-circle" style={{ fontSize:8 }}/>}
              {s.label}
            </div>
            {i < arr.length-1 && <span style={{ color:V.textLight, fontSize:14 }}>›</span>}
          </div>
        ))}
      </div>

      <div style={{ padding:'20px 24px 0' }}>

        {/* global error */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle"/> {error}
          </div>
        )}

        {/* ── Main card ────────────────────────────────────────────────── */}
        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* card header */}
          <div style={{ background:V.navy, padding:'16px 24px' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>
              <i className="fas fa-credit-card" style={{ marginRight:8 }}/>Pay Application Fee
            </h3>
          </div>

          {/* ══ PERSONAL DETAILS ══════════════════════════════════════════ */}
          {/* sub-header */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:V.tealLight, borderBottom:`1px solid ${V.tealBorder}` }}>
            <span style={{ width:3, height:14, background:V.primary, borderRadius:2, flexShrink:0 }}/>
            <i className="fas fa-user" style={{ color:V.teal, fontSize:13 }}/>
            <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>Personal Details</span>
          </div>

          <div style={{ padding:'20px 24px' }}>
            {/* Applied Course — full width row */}
            <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', background:'#fff', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:1 }}>
              <div style={{ padding:'12px 16px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>Applied Course</div>
              <div style={{ padding:'12px 16px', fontSize:13, color:V.textPrimary, fontWeight:700 }}>{fee?.appliedCourse || '—'}</div>
            </div>

            {/* 2-column details grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginTop:8 }}>
              {[
                { label:'Candidate\'s Name', value: fee?.candidateName },
                { label:'Gender',            value: fee?.gender        },
                { label:'Category',          value: fee?.category      },
                { label:'Divyang',           value: fee?.isPWD         },
              ].map((item, i) => (
                <div key={i} style={{
                  display:'grid', gridTemplateColumns:'160px 1fr',
                  borderTop: i >= 2 ? `1px solid ${V.border}` : 'none',
                  borderLeft: i % 2 === 1 ? `1px solid ${V.border}` : 'none',
                  background:'#fff'
                }}>
                  <div style={{ padding:'12px 16px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>
                    {item.label}
                  </div>
                  <div style={{ padding:'12px 16px', fontSize:13, color:V.textPrimary, fontWeight:700 }}>
                    {item.value || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ FEE DETAILS ═══════════════════════════════════════════════ */}
          {/* sub-header */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:V.tealLight, borderTop:`1px solid ${V.border}`, borderBottom:`1px solid ${V.tealBorder}` }}>
            <span style={{ width:3, height:14, background:V.primary, borderRadius:2, flexShrink:0 }}/>
            <i className="fas fa-rupee-sign" style={{ color:V.teal, fontSize:13 }}/>
            <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>Online Application Fee Details</span>
          </div>

          <div style={{ padding:'24px', textAlign:'center' }}>

            {/* ── Payment Success banner — shown when fee paid and user revisits */}
            {isAlreadyPaid && (
              <div style={{
                background:'#f0fdf4', border:'2px solid #86efac',
                borderRadius:12, padding:'20px 24px',
                marginBottom:24, textAlign:'left',
                display:'flex', alignItems:'flex-start', gap:16,
                boxShadow:'0 0 0 4px rgba(134,239,172,0.2)'
              }}>
                <div style={{
                  width:48, height:48, borderRadius:'50%',
                  background:'#dcfce7', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  <i className="fas fa-check-circle" style={{ color:'#16a34a', fontSize:24 }}/>
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#15803d', marginBottom:4 }}>
                    Payment Successful!
                  </div>
                  <div style={{ fontSize:13, color:'#166534', lineHeight:1.6 }}>
                    Your application fee of <strong>₹ {feeToBePaid}/-</strong> has been paid successfully.
                    Please click <strong>Save &amp; Next</strong> to proceed.
                  </div>
                </div>
              </div>
            )}

            {/* fee amount display — navy box same as old .fee-amount */}
            <div style={{ fontSize:11, fontWeight:700, color:V.textSecond, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>
              Fee to be Paid
            </div>
            <div style={{
              display:'inline-block',
              background: isAlreadyPaid ? '#15803d' : V.navy,
              color:'#fff',
              fontSize: isFeeExempt ? 16 : 28, fontWeight:800,
              padding: isFeeExempt ? '14px 28px' : '12px 32px',
              borderRadius:10, marginBottom:24,
              boxShadow: isAlreadyPaid
                ? '0 4px 16px rgba(21,128,61,0.35)'
                : '0 4px 16px rgba(20,33,46,0.3)'
            }}>
              {isFeeExempt
                ? 'NO FEES (Payment Exempted)'
                : isAlreadyPaid
                  ? <><i className="fas fa-check-circle" style={{ fontSize:20, marginRight:10 }}/><span style={{ fontSize:18 }}>₹</span>{feeToBePaid}/- <span style={{ fontSize:14, opacity:0.85, fontWeight:600 }}>Paid ✓</span></>
                  : <><span style={{ fontSize:18 }}>₹</span>{remainingFee}/-</>}
            </div>

            {/* Payment gateway selector — only when fee > 0 and remaining > 0 */}
            {showPay && fee?.paymentGateways?.length > 0 && (
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:V.textSecond, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>
                  Payment Gateway
                </div>
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:16,
                  border:`1.5px solid ${V.tealBorder}`, background:V.tealLight,
                  borderRadius:10, padding:'12px 24px', flexWrap:'wrap',
                  justifyContent:'center'
                }}>
                  {fee.paymentGateways.map(gw => (
                    <label key={gw.paymentGatewayID}
                      style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:15, fontWeight:600, color: selectedGW===gw.paymentGatewayID ? V.primary : V.textPrimary }}>
                      <input
                        type="radio"
                        name="gateway"
                        value={gw.paymentGatewayID}
                        checked={selectedGW === gw.paymentGatewayID}
                        onChange={() => { setSelectedGW(gw.paymentGatewayID); setGwError('') }}
                        style={{ accentColor:V.primary, width:16, height:16 }}
                      />
                      {gw.paymentGatewayName}
                    </label>
                  ))}
                </div>
                {gwError && (
                  <p style={{ fontSize:13, color:V.danger, marginTop:8, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    <i className="fas fa-exclamation-circle"/> {gwError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Note box — same as old .note-box, between content and footer */}
          <div style={{
            background:'#fffbeb', border:'1px solid #fde68a',
            borderRadius:10, margin:'0 24px 0 24px', padding:'12px 16px',
            fontSize:12.5, color:'#92400e',
            display:'flex', alignItems:'flex-start', gap:8
          }}>
            <i className="fas fa-exclamation-circle" style={{ color:'#f59e0b', marginTop:1, flexShrink:0 }}/>
            <span>
              <strong>Note:</strong> During the payment, if the amount has been deducted and payment is not confirmed,
              please wait for <strong>30 minutes</strong> and only then try again to pay.
            </span>
          </div>

          {/* ── Footer — buttons properly centered, same as old .pay-footer ── */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:'20px 24px', borderTop:`1px solid ${V.borderLight}`,
            background:'#f8fafc', gap:12, marginTop:20,
            borderRadius:'0 0 14px 14px'
          }}>
            {/* Back button */}
            <button
              type="button"
              onClick={() => navigate('/candidate/documents')}
              style={{ background:'transparent', color:V.textPrimary, border:`1.5px solid ${V.border}`, padding:'10px 20px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>
              <i className="fas fa-arrow-left"/> Back
            </button>

            {/* Save & Next — fee=0 or already paid (mirrors btnProceed) */}
            {showProceed && (
              <button
                type="button"
                onClick={handleProceed}
                disabled={proceeding}
                style={{ background:proceeding?'#d1fae5':V.primary, color:proceeding?'#6b7280':'#fff', border:'none', padding:'11px 28px', borderRadius:8, fontSize:14, fontWeight:600, cursor:proceeding?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}
                onMouseEnter={e => { if(!proceeding) e.currentTarget.style.background=V.primaryDark }}
                onMouseLeave={e => { if(!proceeding) e.currentTarget.style.background=V.primary }}>
                {proceeding
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                  : <>Save &amp; Next &#8594;</>}
              </button>
            )}

            {/* Proceed to Payment — fee>0 (mirrors btnPay) */}
            {showPay && (
              <button
                type="button"
                onClick={handlePay}
                disabled={paying}
                style={{
                  background: paying ? '#6b7280' : V.primary,
                  color:'#fff', border:'none',
                  padding:'11px 28px', borderRadius:8,
                  fontSize:14, fontWeight:600,
                  cursor: paying ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', gap:8,
                  fontFamily:'inherit',
                  boxShadow: paying ? 'none' : '0 0 15px rgba(5,150,105,0.35)'
                }}
                onMouseEnter={e => { if(!paying) e.currentTarget.style.background=V.primaryDark }}
                onMouseLeave={e => { if(!paying) e.currentTarget.style.background=V.primary }}>
                {paying
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Redirecting to Gateway...</>
                  : <><i className="fas fa-play-circle"/> Proceed to Payment</>}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* scroll-to-top */}
      <button
        onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
        style={{ position:'fixed', bottom:28, right:28, width:44, height:44, borderRadius:'50%', background:'#f97316', color:'#fff', border:'none', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(249,115,22,0.4)', zIndex:50 }}>
        <i className="fas fa-chevron-up"/>
      </button>

    </div>
  )
}
