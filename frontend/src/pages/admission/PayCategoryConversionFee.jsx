import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { admissionApi } from '../../services/api'

/**
 * Pay Category Conversion Fee — mirrors PayCategoryConversionFee.aspx exactly.
 *
 * Layout (exact match to old project):
 *  Header     : navy card — "Pay Category Conversion Fee"
 *  Section 1  : Personal Details — 2-col grid (Name, Gender, Category, Divyang)
 *  Section 2  : Online Category Conversion Fee Details — centered fee amount
 *  Section 3  : Payment Gateway radio list (only when RemainingFee > 0)
 *  Note box   : amber warning
 *  Footer     : Proceed to Payment button (only when RemainingFee > 0)
 */
export default function PayCategoryConversionFee() {
  const { user } = useAuth()

  const [feeData,    setFeeData]    = useState(null)
  const [gateways,   setGateways]   = useState([])
  const [selectedGW, setSelectedGW] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [paying,     setPaying]     = useState(false)
  const [error,      setError]      = useState('')
  const [gwError,    setGwError]    = useState('')

  const V = {
    navy:'#14212e', primary:'#059669', primaryDark:'#047857',
    teal:'#0d9488', tealLight:'#f0fdfb', tealBorder:'#ccfbf1',
    border:'#e2e8f0', borderLight:'#f1f5f9',
    textSecond:'#64748b', textPrimary:'#0f172a',
    danger:'#ef4444', bg:'#f5f6fa',
  }

  useEffect(() => {
    admissionApi.getCategoryConversionFee()
      .then(res => {
        setFeeData(res.data)
        const gws = res.data?.paymentGateways ?? []
        setGateways(gws)
        if (gws.length === 1) setSelectedGW(gws[0].value ? parseInt(gws[0].value) : 0)
      })
      .catch(err => setError(err.response?.data?.message ?? 'Failed to load fee details.'))
      .finally(() => setLoading(false))
  }, [])

  const handlePay = async () => {
    if (!selectedGW) { setGwError('Please Select Payment Gateway.'); return }
    setPaying(true); setError(''); setGwError('')
    try {
      const res = await admissionApi.initiateCategoryConversionFee({
        phaseID:          feeData.phaseID,
        paymentGatewayID: selectedGW,
      })
      if (res.data.success && res.data.paymentGatewayURL) {
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

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:V.textSecond, fontSize:14 }}>Loading...</p>
      </div>
    </div>
  )

  const isFeeExempt   = !feeData || feeData.feeToBePaid <= 0
  const isAlreadyPaid = feeData?.feeToBePaid > 0 && feeData?.remainingFee <= 0
  const showPay       = feeData?.remainingFee > 0

  // Sub-section header — matches .pay-sub-header in old project
  const SubHeader = ({ title }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:V.tealLight, borderTop:`1px solid ${V.border}`, borderBottom:`1px solid ${V.tealBorder}` }}>
      <span style={{ width:3, height:14, background:V.primary, borderRadius:2, flexShrink:0 }}/>
      <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>{title}</span>
    </div>
  )

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 24px 40px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>

        {/* Application ID info bar */}
        <div style={{ background:'#fff', borderBottom:`1px solid ${V.border}`, padding:'10px 24px', display:'flex', alignItems:'center', gap:'6px 32px', marginBottom:16, borderRadius:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:V.textSecond, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Application ID</span>
          <span style={{ fontSize:15, fontWeight:700, color:V.primary }}>{user?.userLoginID || '—'}</span>
        </div>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{error}
          </div>
        )}

        {/* ── Main card ────────────────────────────────────────────────── */}
        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* Card header — navy */}
          <div style={{ background:V.navy, padding:'16px 24px' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>
              <i className="fas fa-exchange-alt" style={{ marginRight:8 }}/>Pay Category Conversion Fee
            </h3>
          </div>

          {/* ── Personal Details ─────────────────────────────────────── */}
          <SubHeader title="Personal Details"/>
          <div style={{ padding:'20px 24px' }}>
            {/* 2-column grid — matches .details-grid in old project */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:10, overflow:'hidden', gap:1, background:V.border }}>
              {[
                ['Candidate\'s Name', feeData?.candidateName],
                ['Gender',            feeData?.gender],
                ['Category',          feeData?.category],
                ['Divyang',           feeData?.isPWD],
              ].map(([label, value], i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'200px 1fr', background:'#fff' }}>
                  <div style={{ padding:'12px 16px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                  <div style={{ padding:'12px 16px', fontSize:13, fontWeight:700, color:V.textPrimary }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Online Category Conversion Fee Details ────────────────── */}
          <SubHeader title="Online Category Conversion Fee Details"/>
          {/* fee-center — matches .fee-center in old project */}
          <div style={{ textAlign:'center', padding:'24px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:V.textSecond, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>
              Fee to be Paid
            </div>
            <div style={{
              display:'inline-block',
              background: isAlreadyPaid ? '#15803d' : V.navy,
              color:'#fff',
              fontSize: isFeeExempt ? 16 : 28,
              fontWeight:800,
              padding: isFeeExempt ? '14px 28px' : '12px 28px',
              borderRadius:10,
              marginBottom:4,
            }}>
              {isFeeExempt
                ? 'NO CATEGORY CONVERSION FEES'
                : isAlreadyPaid
                  ? <><i className="fas fa-check-circle" style={{ marginRight:8 }}/>₹{feeData.feeToBePaid}/- (Already Paid)</>
                  : <><span style={{ fontSize:18 }}>₹</span>{feeData?.remainingFee}/-</>}
            </div>
          </div>

          {/* ── Payment Gateway (only when remaining fee > 0) ─────────── */}
          {showPay && gateways.length > 0 && (
            <div style={{ padding:'0 24px 20px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:V.textSecond, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>
                Payment Gateway
              </div>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                {gateways.map(gw => (
                  <label key={gw.value}
                    style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color: selectedGW===parseInt(gw.value) ? V.primary : V.textSecond, cursor:'pointer' }}>
                    <input type="radio" name="gateway" value={gw.value}
                      checked={selectedGW === parseInt(gw.value)}
                      onChange={() => { setSelectedGW(parseInt(gw.value)); setGwError('') }}
                      style={{ accentColor:V.primary, width:15, height:15, cursor:'pointer' }}/>
                    {gw.text}
                  </label>
                ))}
              </div>
              {gwError && <p style={{ fontSize:13, color:V.danger, marginTop:6 }}><i className="fas fa-exclamation-circle"/> {gwError}</p>}
            </div>
          )}

          {/* ── Note box — matches .note-box in old project ──────────── */}
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', margin:'0 24px 20px', fontSize:12.5, color:'#92400e', display:'flex', alignItems:'flex-start', gap:8 }}>
            <i className="fas fa-exclamation-triangle" style={{ color:'#f59e0b', marginTop:1, flexShrink:0 }}/>
            <span><strong>Note:</strong> During the payment, if the amount has been deducted and payment is not confirmed, please wait for <strong>30 minutes</strong> and only then try again to pay.</span>
          </div>

          {/* ── Footer — Proceed to Payment (only when remaining fee > 0) */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 24px', borderTop:`1px solid ${V.borderLight}`, background:'#f8fafc', borderRadius:'0 0 14px 14px' }}>
            {showPay && (
              <button type="button" onClick={handlePay} disabled={paying}
                style={{ background:paying?'#6b7280':V.primary, color:'#fff', border:'none', padding:'12px 32px', borderRadius:8, fontSize:14, fontWeight:600, cursor:paying?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, boxShadow:'0 0 15px rgba(5,150,105,.25)' }}
                onMouseEnter={e => { if(!paying) e.currentTarget.style.background=V.primaryDark }}
                onMouseLeave={e => { if(!paying) e.currentTarget.style.background=V.primary }}>
                {paying
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Redirecting to Gateway...</>
                  : <><i className="fas fa-play-circle"/>Proceed to Payment</>}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
