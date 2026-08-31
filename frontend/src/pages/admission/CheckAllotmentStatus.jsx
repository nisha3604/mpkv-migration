import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { admissionApi } from '../../services/api'

/**
 * Check Allotment Status — mirrors CheckAllotmentStatus.aspx exactly.
 *
 * Flow (same as old project):
 *  1. Load phases dropdown (Admission_GetPhaseList)
 *  2. For candidate (UserTypeID=91): applicationID pre-filled + disabled
 *  3. Select phase → Check → POST /api/admission/allotment-status
 *  4. Show candidate info + allotment details
 *  5. If wish to take admission → Download Allotment Letter button
 *  6. If refuse → show refusal fee + payment gateway → Pay Refusal Fee
 */
export default function CheckAllotmentStatus() {
  const { user } = useAuth()
  const isCandidate = user?.userTypeID === 91 || user?.userTypeID === '91'

  const [phases,       setPhases]       = useState([])
  const [phaseId,      setPhaseId]      = useState('')
  const [appId,        setAppId]        = useState(isCandidate ? (user?.userLoginID ?? '') : '')
  const [result,       setResult]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [checking,     setChecking]     = useState(false)
  const [error,        setError]        = useState('')
  const [wish,         setWish]         = useState('')     // '1'=take, '0'=refuse
  const [wishRefuse,   setWishRefuse]   = useState('')     // '1'=pay fee, '0'=back preference
  const [selectedGW,   setSelectedGW]   = useState(0)
  const [gateways,     setGateways]     = useState([])
  const [paying,       setPaying]       = useState(false)
  const [downloading,  setDownloading]  = useState(false)

  const V = { navy:'#14212e', primary:'#059669', primaryDark:'#047857', teal:'#0d9488', tealLight:'#f0fdfb', tealBorder:'#ccfbf1', border:'#e2e8f0', textSecond:'#64748b', textPrimary:'#0f172a', danger:'#ef4444', bg:'#f5f6fa' }

  useEffect(() => {
    admissionApi.getPhases()
      .then(res => {
        const list = res.data?.phases ?? []
        setPhases(list)
        setGateways(res.data?.paymentGateways ?? [])
        const cur = res.data?.currentPhaseID?.toString()
        const sel = list.find(p => p.value === cur) ? cur : (list[0]?.value ?? '')
        setPhaseId(sel)
        // Auto-check for candidates on mount if phase available
        if (sel && isCandidate && user?.userLoginID) {
          checkAllotment(sel, user.userLoginID)
        }
      })
      .catch(() => setError('Failed to load phases.'))
      .finally(() => setLoading(false))
  }, [])

  const checkAllotment = async (pid, aid) => {
    const p = pid || phaseId; const a = aid || appId
    if (!p || !a) return
    setChecking(true); setError(''); setResult(null); setWish(''); setWishRefuse('')
    try {
      const res = await admissionApi.checkAllotment({ applicationID: a, phaseID: parseInt(p) })
      if (res.data.success) setResult(res.data)
      else setError(res.data.message || 'No allotment found for this phase.')
    } catch (err) { setError(err.response?.data?.message ?? 'An error occurred.') }
    finally { setChecking(false) }
  }

  const handleDownload = async () => {
    setDownloading(true); setError('')
    try {
      const res = await admissionApi.downloadLetter({
        candidateID: result.candidateID,
        collegeID:   result.allottedCollegeID,
        phaseID:     parseInt(phaseId),
      })
      if (res.data.success && res.data.printUrl) {
        window.open(res.data.printUrl, '_blank')
      } else setError(res.data.message || 'Failed to download letter.')
    } catch (err) { setError(err.response?.data?.message ?? 'Download failed.') }
    finally { setDownloading(false) }
  }

  const handlePayRefusal = async () => {
    if (!selectedGW) { setError('Please select a payment gateway.'); return }
    setPaying(true); setError('')
    try {
      const res = await admissionApi.payRefusalFee({
        candidateID:      result.candidateID,
        phaseID:          parseInt(phaseId),
        paymentGatewayID: selectedGW,
      })
      if (res.data.success && res.data.paymentGatewayURL) window.location.href = res.data.paymentGatewayURL
      else { setError(res.data.message || 'Failed to initiate payment.'); setPaying(false) }
    } catch (err) { setError(err.response?.data?.message ?? 'Payment initiation failed.'); setPaying(false) }
  }

  const resolveUrl = url => {
    if (!url) return '/dummy-user.png'
    let cur = url
    while (cur.includes('ViewFile.aspx') && cur.includes('FileURL=')) {
      const m = cur.match(/FileURL=([^&\s]+)/); if (!m?.[1]) break
      const x = decodeURIComponent(m[1]); if (x===cur) break; cur=x
    }
    return cur
  }

  const Row = ({ label, value }) => (
    <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', borderTop:`1px solid ${V.border}`, background:'#fff' }}>
      <div style={{ padding:'9px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
      <div style={{ padding:'9px 14px', fontSize:13, fontWeight:600, color:V.textPrimary }}>{value || '—'}</div>
    </div>
  )

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"/>
    </div>
  )

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 24px 40px' }}>
      <div style={{ maxWidth:820, margin:'0 auto' }}>

        {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13 }}><i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{error}</div>}

        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', marginBottom:20 }}>
          <div style={{ background:V.navy, padding:'16px 24px' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>
              <i className="fas fa-search" style={{ marginRight:8 }}/>Check Allotment Status
            </h3>
          </div>

          <div style={{ padding:'20px 24px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
            {/* Application ID */}
            <div style={{ flex:1, minWidth:180 }}>
              <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:V.textSecond, marginBottom:5 }}>Application ID</label>
              <input type="text" value={appId} onChange={e => setAppId(e.target.value)} disabled={isCandidate} placeholder="Enter Application ID"
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit', outline:'none', background: isCandidate?'#f8fafc':'#fff', boxSizing:'border-box', textTransform:'uppercase' }}/>
            </div>
            {/* Phase */}
            <div style={{ flex:1, minWidth:180 }}>
              <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:V.textSecond, marginBottom:5 }}>Round / Phase</label>
              <select value={phaseId} onChange={e => setPhaseId(e.target.value)}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit', outline:'none', background:'#fff', boxSizing:'border-box', cursor:'pointer' }}>
                <option value="">-- Select Round --</option>
                {phases.map(p => <option key={p.value} value={p.value}>{p.text}</option>)}
              </select>
            </div>
            {/* Check button */}
            <button type="button" onClick={() => checkAllotment()} disabled={checking || !phaseId || !appId}
              style={{ background:(!phaseId||!appId||checking)?'#e2e8f0':V.primary, color:(!phaseId||!appId||checking)?'#6b7280':'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:600, cursor:(!phaseId||!appId||checking)?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}
              onMouseEnter={e => { if(phaseId&&appId&&!checking) e.currentTarget.style.background=V.primaryDark }}
              onMouseLeave={e => { if(phaseId&&appId&&!checking) e.currentTarget.style.background=V.primary }}>
              {checking ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Checking...</> : <><i className="fas fa-search"/>Check Allotment</>}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Candidate + weightage info */}
            <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', background:V.tealLight, borderBottom:`1px solid ${V.tealBorder}` }}>
                <span style={{ width:3, height:14, background:V.primary, borderRadius:2 }}/>
                <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>Candidate Details</span>
              </div>
              <div style={{ padding:'16px 20px', display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
                    <Row label="Application ID"    value={result.applicationID}/>
                    <Row label="Candidate Name"    value={result.candidateName}/>
                    <Row label="Applied Course"    value={result.appliedCourse}/>
                    <Row label="Gender"            value={result.gender}/>
                    <Row label="Date of Birth"     value={result.dob}/>
                    <Row label="Domicile District" value={result.domicileDistrict}/>
                    <Row label="Category"          value={result.category}/>
                    <Row label="Total Weightage"   value={result.totalWeightage}/>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, flexShrink:0 }}>
                  <img src={resolveUrl(result.photoURL)} alt="Photo"
                    style={{ width:90, height:116, objectFit:'contain', border:`2px solid ${V.border}`, borderRadius:6 }}
                    onError={e => { e.currentTarget.src='/dummy-user.png' }}/>
                  <img src={resolveUrl(result.signURL)} alt="Sign"
                    style={{ width:120, height:42, objectFit:'contain', border:`2px solid ${V.border}`, borderRadius:6 }}
                    onError={e => { e.currentTarget.src='/dummy-user.png' }}/>
                </div>
              </div>
            </div>

            {/* Allotment details */}
            <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', background:V.tealLight, borderBottom:`1px solid ${V.tealBorder}` }}>
                <span style={{ width:3, height:14, background:V.primary, borderRadius:2 }}/>
                <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>Allotment Details</span>
              </div>
              <div style={{ padding:'16px 20px' }}>
                <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
                  <Row label="Round"              value={result.allotmentPhase}/>
                  <Row label="Allotted College"   value={`${result.allottedCollegeCode} - ${result.allottedCollege}`}/>
                  <Row label="Allotted Course"    value={result.allottedCourse}/>
                  <Row label="Allotted Category"  value={result.allottedCategory}/>
                  <Row label="Allotted Type"      value={result.allottedType}/>
                  <Row label="Admission Schedule" value={result.admissionSchedule}/>
                  {result.refusalRemainingFee > 0 && <Row label="Refusal Fee" value={`₹ ${result.refusalRemainingFee}/-`}/>}
                </div>
              </div>
            </div>

            {/* Wish to take admission / refuse */}
            {result.isEligibleToDownloadAllotmentLetter && (
              <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', marginBottom:16, padding:'20px 24px' }}>
                <p style={{ fontSize:14, fontWeight:600, color:V.textPrimary, marginBottom:14 }}>Do you wish to take admission in the allotted college?</p>
                <div style={{ display:'flex', gap:16, marginBottom:16 }}>
                  {[['1','Yes, I wish to take admission'],['0','No, I refuse this allotment']].map(([val, lbl]) => (
                    <label key={val} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, fontWeight: wish===val ? 700 : 500, color: wish===val ? V.primary : V.textPrimary }}>
                      <input type="radio" name="wish" value={val} checked={wish===val} onChange={() => { setWish(val); setWishRefuse('') }} style={{ accentColor:V.primary, width:16, height:16 }}/>{lbl}
                    </label>
                  ))}
                </div>

                {/* Wish = YES → Download button */}
                {wish === '1' && (
                  <button onClick={handleDownload} disabled={downloading}
                    style={{ background:downloading?'#6b7280':V.primary, color:'#fff', border:'none', padding:'11px 28px', borderRadius:8, fontSize:14, fontWeight:600, cursor:downloading?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}
                    onMouseEnter={e => { if(!downloading) e.currentTarget.style.background=V.primaryDark }}
                    onMouseLeave={e => { if(!downloading) e.currentTarget.style.background=V.primary }}>
                    {downloading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Downloading...</> : <><i className="fas fa-download"/>Download Allotment Letter</>}
                  </button>
                )}

                {/* Wish = NO → Refuse options (only Round 1, 5, 8) */}
                {wish === '0' && result.refusalRemainingFee > 0 && (
                  <>
                    <p style={{ fontSize:14, fontWeight:600, color:V.textPrimary, margin:'14px 0 10px' }}>Do you wish to pay refusal fee?</p>
                    <div style={{ display:'flex', gap:16, marginBottom:14 }}>
                      {[['1','Yes, Pay Refusal Fee'],['0','No']].map(([val, lbl]) => (
                        <label key={val} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, fontWeight: wishRefuse===val ? 700 : 500, color: wishRefuse===val ? V.primary : V.textPrimary }}>
                          <input type="radio" name="wishRefuse" value={val} checked={wishRefuse===val} onChange={() => setWishRefuse(val)} style={{ accentColor:V.primary, width:16, height:16 }}/>{lbl}
                        </label>
                      ))}
                    </div>

                    {wishRefuse === '1' && gateways.length > 0 && (
                      <>
                        <div style={{ display:'flex', gap:16, marginBottom:14, flexWrap:'wrap' }}>
                          {gateways.map(gw => (
                            <label key={gw.paymentGatewayID} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, fontWeight: selectedGW===gw.paymentGatewayID ? 700 : 500 }}>
                              <input type="radio" name="gw" value={gw.paymentGatewayID} checked={selectedGW===gw.paymentGatewayID} onChange={() => setSelectedGW(gw.paymentGatewayID)} style={{ accentColor:V.primary, width:16, height:16 }}/>{gw.paymentGatewayName}
                            </label>
                          ))}
                        </div>
                        <button onClick={handlePayRefusal} disabled={paying}
                          style={{ background:paying?'#6b7280':V.primary, color:'#fff', border:'none', padding:'11px 28px', borderRadius:8, fontSize:14, fontWeight:600, cursor:paying?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}>
                          {paying ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Redirecting...</> : <><i className="fas fa-play-circle"/>Pay Refusal Fee ₹{result.refusalRemainingFee}/-</>}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Already downloaded */}
            {result.isAllotmentLetterDownloaded && wish !== '1' && wish !== '0' && (
              <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:12, padding:'16px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
                <i className="fas fa-check-circle" style={{ color:'#16a34a', fontSize:24 }}/>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#15803d' }}>Allotment Letter Already Downloaded</div>
                  <div style={{ fontSize:13, color:'#166534', marginTop:2 }}>You have already downloaded your allotment letter.</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
