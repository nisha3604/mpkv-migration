import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * Category & Other Reservation — exact UI match to CategoryAndOtherReservation.aspx
 *
 * Three sub-sections (with teal sub-header + left-border bar):
 *   1. Category Details
 *   2. Other Reservation Details    
 *   3. Weightage Details
 *
 * yn-grid = 2-column grid of Yes/No card items
 * Full exact question text from old aspx preserved
 */
export default function Category() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [masters,       setMasters]       = useState({ domicileDistricts: [], categories: [] })
  const [pageLoading,   setPageLoading]   = useState(true)
  const [applicationId, setApplicationId] = useState('')
  const [showConfirm,   setShowConfirm]   = useState(false)
  const [fieldErrors,   setFieldErrors]   = useState({})
  const [error,         setError]         = useState('')
  const [submitting,    setSubmitting]    = useState(false)

  const [form, setForm] = useState({
    domicileDistrictID:         '',
    domicileVillage:            '',
    categoryID:                 '',
    caste:                      '',
    hasCasteCertificate:        '',
    hasReceiptCasteCertificate: '',
    hasNCLCertificate:          '',
    hasNCLReceipt:              '',
    hasEWSCertificate:          '',
    isOrphan:                   '',
    isPWD:                      '',
    isExServiceman:             '',
    isFreedomFighter:           '',
    isProjectAffected:          '',
    isLandlessFarmLabourer:     '',
    isIncomeSourceAgriculture:  '',
    isNCC:                      '',
    isMPKVEmployee:             '',
    hasFarm:                    '',
    isSports:                   '',
  })

  // ── Visibility rules — exact match to onPageLoad + ddlCategory_SelectedIndexChanged
  const catID       = parseInt(form.categoryID) || 0
  const isScSt      = catID === 2 || catID === 3
  const isObc       = catID > 3 && catID < 11
  const isEws       = catID === 11
  const showCaste   = isScSt || isObc
  const showNCL     = isObc
  const showEWS     = isEws
  const showRcvCaste= showCaste && form.hasCasteCertificate === '0'
  const showNclRcpt = showNCL   && form.hasNCLCertificate  === '0'

  // ── FinalCategoryID — exact mirror of old GetFinalCategoryID()
  function computeFinal() {
    const cat   = parseInt(form.categoryID)             || -1
    const hc    = parseInt(form.hasCasteCertificate)    ||  0
    const hr    = parseInt(form.hasReceiptCasteCertificate) || 0
    const hn    = parseInt(form.hasNCLCertificate)      ||  0
    const hnr   = parseInt(form.hasNCLReceipt)          ||  0
    const hews  = parseInt(form.hasEWSCertificate)      ||  0
    if ((cat===2||cat===3) && hc===0 && hr===0) return 1
    if (cat>3 && cat<11 && ((hc===0&&hr===0)||(hn===0&&hnr===0))) return 1
    if (cat===11 && hews===0) return 1
    return cat
  }

  // ── Load
  useEffect(() => {
    Promise.all([
      applicationFormApi.getCategoryMasters(),
      applicationFormApi.getCategory(),
    ])
      .then(([mRes, dRes]) => {
        setMasters(mRes.data)
        setApplicationId(user?.userLoginID ?? '')
        const d = dRes.data
        if (d.found) {
          setForm({
            domicileDistrictID:         d.domicileDistrictID?.toString()         ?? '',
            domicileVillage:            d.domicileVillage                        ?? '',
            categoryID:                 d.categoryID?.toString()                 ?? '',
            caste:                      d.caste                                  ?? '',
            hasCasteCertificate:        d.hasCasteCertificate?.toString()        ?? '',
            hasReceiptCasteCertificate: d.hasReceiptCasteCertificate?.toString() ?? '',
            hasNCLCertificate:          d.hasNCLCertificate?.toString()          ?? '',
            hasNCLReceipt:              d.hasNCLReceipt?.toString()              ?? '',
            hasEWSCertificate:          d.hasEWSCertificate?.toString()          ?? '',
            isOrphan:                   d.isOrphan?.toString()                   ?? '',
            isPWD:                      d.isPWD?.toString()                      ?? '',
            isExServiceman:             d.isExServiceman?.toString()             ?? '',
            isFreedomFighter:           d.isFreedomFighter?.toString()           ?? '',
            isProjectAffected:          d.isProjectAffected?.toString()          ?? '',
            isLandlessFarmLabourer:     d.isLandlessFarmLabourer?.toString()     ?? '',
            isIncomeSourceAgriculture:  d.isIncomeSourceAgriculture?.toString()  ?? '',
            isNCC:                      d.isNCC?.toString()                      ?? '',
            isMPKVEmployee:             d.isMPKVEmployee?.toString()             ?? '',
            hasFarm:                    d.hasFarm?.toString()                    ?? '',
            isSports:                   d.isSports?.toString()                   ?? '',
          })
        }
      })
      .catch(() => setError('Failed to load page data. Please refresh.'))
      .finally(() => setPageLoading(false))
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => {
      const u = { ...f, [name]: value }
      if (name === 'categoryID') {
        u.hasCasteCertificate = ''
        u.hasReceiptCasteCertificate = ''
        u.hasNCLCertificate  = ''
        u.hasNCLReceipt      = ''
        u.hasEWSCertificate  = ''
        u.isOrphan           = ''
      }
      if (name === 'hasCasteCertificate' && value === '1') u.hasReceiptCasteCertificate = ''
      if (name === 'hasNCLCertificate'   && value === '1') u.hasNCLReceipt = ''
      return u
    })
    setFieldErrors(fe => ({ ...fe, [name]: '' }))
    setError('')
  }

  const validate = () => {
    const e = {}
    if (!form.domicileDistrictID) e.domicileDistrictID = 'Please Select Domicile District.'
    if (!form.domicileVillage?.trim()) e.domicileVillage = "Please Enter Father's Domicile Village."
    if (!form.categoryID)  e.categoryID  = 'Please Select Category.'
    if (!form.caste?.trim()) e.caste = 'Please Enter Caste.'
    if (showCaste  && !form.hasCasteCertificate)        e.hasCasteCertificate        = 'Please Select Caste Certificate Status.'
    if (showRcvCaste && !form.hasReceiptCasteCertificate) e.hasReceiptCasteCertificate = 'Please Select Caste Certificate Receipt Status.'
    if (showNCL    && !form.hasNCLCertificate)          e.hasNCLCertificate          = 'Please Select Non-Creamy Layer Certificate Status.'
    if (showNclRcpt && !form.hasNCLReceipt)             e.hasNCLReceipt              = 'Please Select NCL Certificate Receipt Status.'
    if (showEWS    && !form.hasEWSCertificate)          e.hasEWSCertificate          = 'Please Select EWS Certificate Status.'
    if (!form.isOrphan)                e.isOrphan               = 'Please Select Orphan Status.'
    if (!form.isPWD)                   e.isPWD                  = 'Please Select PWD Status.'
    if (!form.isExServiceman)          e.isExServiceman         = 'Please Select Ex-Serviceman Status.'
    if (!form.isFreedomFighter)        e.isFreedomFighter       = 'Please Select Freedom Fighter Status.'
    if (!form.isProjectAffected)       e.isProjectAffected      = 'Please Select Project Affected Status.'
    if (!form.isLandlessFarmLabourer)  e.isLandlessFarmLabourer = 'Please Select Landless Farm Labourer Status.'
    if (!form.isIncomeSourceAgriculture) e.isIncomeSourceAgriculture = 'Please Select Agriculture Income Source Status.'
    if (!form.isNCC)        e.isNCC        = 'Please Select NCC / MCC / Scout Status.'
    if (!form.isMPKVEmployee) e.isMPKVEmployee = 'Please Select MPKV Employee Status.'
    if (!form.hasFarm)      e.hasFarm      = 'Please Select Farm Holding Status.'
    if (!form.isSports)     e.isSports     = 'Please Select Sports / Cultural Status.'
    return e
  }

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    const finalCat = computeFinal()
    const selCat   = parseInt(form.categoryID) || 0
    if (finalCat !== selCat && selCat > 0) { setShowConfirm(true); return }
    doSave()
  }

  const doSave = async () => {
    setShowConfirm(false)
    setSubmitting(true)
    setError('')
    try {
      await applicationFormApi.saveCategory({
        domicileDistrictID:         parseInt(form.domicileDistrictID)             ||0,
        domicileVillage:            form.domicileVillage?.trim()                  ||'',
        categoryID:                 parseInt(form.categoryID)                     ||0,
        finalCategoryID:            computeFinal(),
        caste:                      form.caste?.trim()                            ||'',
        hasCasteCertificate:        parseInt(form.hasCasteCertificate)            ||0,
        hasReceiptCasteCertificate: parseInt(form.hasReceiptCasteCertificate)     ||0,
        hasNCLCertificate:          parseInt(form.hasNCLCertificate)              ||0,
        hasNCLReceipt:              parseInt(form.hasNCLReceipt)                  ||0,
        hasEWSCertificate:          parseInt(form.hasEWSCertificate)              ||0,
        isOrphan:                   parseInt(form.isOrphan)                       ||0,
        isPWD:                      parseInt(form.isPWD)                          ||0,
        isExServiceman:             parseInt(form.isExServiceman)                 ||0,
        isFreedomFighter:           parseInt(form.isFreedomFighter)               ||0,
        isProjectAffected:          parseInt(form.isProjectAffected)              ||0,
        isNCC:                      parseInt(form.isNCC)                          ||0,
        isSports:                   parseInt(form.isSports)                       ||0,
        isMPKVEmployee:             parseInt(form.isMPKVEmployee)                 ||0,
        isLandlessFarmLabourer:     parseInt(form.isLandlessFarmLabourer)         ||0,
        isIncomeSourceAgriculture:  parseInt(form.isIncomeSourceAgriculture)      ||0,
        hasFarm:                    parseInt(form.hasFarm)                        ||0,
      })
      navigate('/candidate/qualification')
    } catch (err) {
      const msg = err.response?.data?.message ?? err.response?.data ?? 'Failed to save.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally { setSubmitting(false) }
  }

  if (pageLoading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:'#64748b',fontSize:14 }}>Loading...</p>
      </div>
    </div>
  )

  // ── CSS vars (same as old theme) ──────────────────────────────────────────
  const V = {
    navy:          '#14212e',
    teal:          '#0d9488',
    tealLight:     '#f0fdfb',
    tealBorder:    '#ccfbf1',
    primary:       '#059669',
    primaryDark:   '#047857',
    border:        '#e2e8f0',
    borderLight:   '#f1f5f9',
    textPrimary:   '#0f172a',
    textSecondary: '#64748b',
    bg:            '#f5f6fa',
    card:          '#ffffff',
    danger:        '#ef4444',
  }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', paddingBottom:40 }}>

      {/* ── top info bar */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${V.border}`, padding:'10px 24px', display:'flex', alignItems:'center', flexWrap:'wrap', gap:'6px 32px' }}>
        <span style={{ fontSize:12, color:V.textSecondary, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Application ID</span>
        <span style={{ fontSize:15, fontWeight:700, color:V.primary }}>{applicationId||'—'}</span>
      </div>

      {/* ── step bar */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'20px 24px 0', flexWrap:'wrap' }}>
        {[
          { label:'Application Form', active:true },
          { label:'College Selection & Preference', active:false },
          { label:'Documents Upload', active:false },
          { label:'Fee Payment', active:false },
          { label:'Lock Form', active:false },
        ].map((s,i,arr)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ display:'flex',alignItems:'center',gap:6, padding:'6px 14px', borderRadius:20, fontSize:12.5, fontWeight:600, background:s.active?V.primary:V.borderLight, color:s.active?'#fff':V.textSecondary, border:`1px solid ${s.active?V.primary:V.border}` }}>
              {s.active && <i className="fas fa-circle" style={{ fontSize:8 }}/>}
              {s.label}
            </div>
            {i<arr.length-1 && <span style={{ color:V.textSecondary, fontSize:12 }}>›</span>}
          </div>
        ))}
      </div>

      {/* ── page wrap */}
      <div style={{ padding:'20px 24px 24px', background:V.bg }}>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle"/> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* ════ MAIN CARD ════════════════════════════════════════════════ */}
          <div style={{ background:V.card, border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

            {/* card header */}
            <div style={{ background:V.navy, padding:'16px 24px' }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>Category &amp; Other Reservation Details</h3>
            </div>

            {/* ── SUB-SECTION 1: Category Details ──────────────────────── */}
            <SubSection title="Category Details">

              {/* 4-col grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:20 }} className="cat-grid-4">

                <PField label="Father's Domicile District" required error={fieldErrors.domicileDistrictID}>
                  <select name="domicileDistrictID" value={form.domicileDistrictID} onChange={handleChange}
                    style={selStyle(!!fieldErrors.domicileDistrictID)}>
                    <option value="">-- Select --</option>
                    {masters.domicileDistricts.map(d=>(
                      <option key={d.value} value={d.value}>{d.text}</option>
                    ))}
                  </select>
                </PField>

                <PField label="Father's Domicile Village" required error={fieldErrors.domicileVillage}>
                  <input name="domicileVillage" type="text" maxLength={50} placeholder="Village name"
                    value={form.domicileVillage} onChange={handleChange}
                    style={inpStyle(!!fieldErrors.domicileVillage)}/>
                </PField>

                <PField label="Reservation Category" required error={fieldErrors.categoryID}>
                  <select name="categoryID" value={form.categoryID} onChange={handleChange}
                    style={selStyle(!!fieldErrors.categoryID)}>
                    <option value="">-- Select --</option>
                    {masters.categories.map(c=>(
                      <option key={c.value} value={c.value}>{c.text}</option>
                    ))}
                  </select>
                </PField>

                <PField label="Caste" required error={fieldErrors.caste}>
                  <input name="caste" type="text" maxLength={50} placeholder="Caste"
                    value={form.caste} onChange={handleChange}
                    style={inpStyle(!!fieldErrors.caste)}/>
                </PField>

              </div>

              {/* Certificate yn-cards — shown conditionally */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="yn-grid">

                {showCaste && (
                  <YNCard label="Do You have Caste Certificate ?" required
                    name="hasCasteCertificate" value={form.hasCasteCertificate}
                    onChange={handleChange} error={fieldErrors.hasCasteCertificate}/>
                )}
                {showRcvCaste && (
                  <YNCard label="Do You have Caste Certificate Receipt ?" required
                    name="hasReceiptCasteCertificate" value={form.hasReceiptCasteCertificate}
                    onChange={handleChange} error={fieldErrors.hasReceiptCasteCertificate}/>
                )}
                {showNCL && (
                  <YNCard label="Do You have Non-Creamy Layer Certificate ?" required
                    name="hasNCLCertificate" value={form.hasNCLCertificate}
                    onChange={handleChange} error={fieldErrors.hasNCLCertificate}/>
                )}
                {showNclRcpt && (
                  <YNCard label="Do You have Non-Creamy Layer Certificate Receipt ?" required
                    name="hasNCLReceipt" value={form.hasNCLReceipt}
                    onChange={handleChange} error={fieldErrors.hasNCLReceipt}/>
                )}
                {showEWS && (
                  <YNCard label="Do You have Economically Weaker Section Certificate ?" required
                    name="hasEWSCertificate" value={form.hasEWSCertificate}
                    onChange={handleChange} error={fieldErrors.hasEWSCertificate}/>
                )}

              </div>
            </SubSection>

            {/* ── SUB-SECTION 2: Other Reservation Details ─────────────── */}
            <SubSection title="Other Reservation Details">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }} className="yn-grid">
                <YNCard label="Are you an Orphan ?" required name="isOrphan" value={form.isOrphan} onChange={handleChange} error={fieldErrors.isOrphan}/>
                <YNCard label="Are you a Person with Disability (Divyang) ?" required name="isPWD" value={form.isPWD} onChange={handleChange} error={fieldErrors.isPWD}/>
                <YNCard label="Are you an Ex-Serviceman or Son / Daughter of an Ex-Serviceman ?" required name="isExServiceman" value={form.isExServiceman} onChange={handleChange} error={fieldErrors.isExServiceman}/>
                <YNCard label="Are you Son / Daughter of a Freedom Fighter ?" required name="isFreedomFighter" value={form.isFreedomFighter} onChange={handleChange} error={fieldErrors.isFreedomFighter}/>
                <YNCard label="Are you Project Affected ?" required name="isProjectAffected" value={form.isProjectAffected} onChange={handleChange} error={fieldErrors.isProjectAffected}/>
                <YNCard label="Are you Son / Daughter of a Landless Farm Labourer ?" required name="isLandlessFarmLabourer" value={form.isLandlessFarmLabourer} onChange={handleChange} error={fieldErrors.isLandlessFarmLabourer}/>
              </div>
              {/* Full-width income question */}
              <YNCard
                label="Are you Son / Daughter of a Farmer / Farm Labourer whose only source of income is Agriculture ?"
                required name="isIncomeSourceAgriculture" value={form.isIncomeSourceAgriculture}
                onChange={handleChange} error={fieldErrors.isIncomeSourceAgriculture}
                fullWidth/>
            </SubSection>

            {/* ── SUB-SECTION 3: Weightage Details ─────────────────────── */}
            <SubSection title="Weightage Details">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="yn-grid">
                <YNCard label="Have you participated in NCC / MCC / Scout ?" required name="isNCC" value={form.isNCC} onChange={handleChange} error={fieldErrors.isNCC}/>
                <YNCard label="Are you Son / Daughter of an Employee of Mahatma Phule Agriculture University (MPKV) ?" required name="isMPKVEmployee" value={form.isMPKVEmployee} onChange={handleChange} error={fieldErrors.isMPKVEmployee}/>
                <YNCard label="Do you hold agricultural land ? (Do you wish to avail reservation under Farmer Category [AG Category] ?)" required name="hasFarm" value={form.hasFarm} onChange={handleChange} error={fieldErrors.hasFarm}/>
                <YNCard label="Have you participated in Sports / Debate / Essay / Cultural events or represented your school ?" required name="isSports" value={form.isSports} onChange={handleChange} error={fieldErrors.isSports}/>
              </div>
            </SubSection>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderTop:`1px solid ${V.borderLight}`, background:'#f8fafc', borderRadius:'0 0 14px 14px', flexWrap:'wrap', gap:12, position:'relative' }}>
              <div style={{ fontSize:12, color:V.textSecondary, display:'flex', alignItems:'center', gap:4, flex:1 }}>
                <span style={{ color:V.danger }}>*</span> Fields marked are mandatory
              </div>
              <div style={{ display:'flex', gap:10, position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
                <button type="button" onClick={()=>navigate('/candidate/address')}
                  style={{ background:'transparent', color:V.textPrimary, border:`1.5px solid ${V.border}`, padding:'10px 20px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  ← Back
                </button>
                <button type="submit" disabled={submitting}
                  style={{ background:submitting?'#86efac':V.primary, color:'#fff', border:'none', padding:'11px 28px', borderRadius:8, fontSize:14, fontWeight:600, cursor:submitting?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e=>{ if(!submitting) e.currentTarget.style.background=V.primaryDark }}
                  onMouseLeave={e=>{ if(!submitting) e.currentTarget.style.background=V.primary }}>
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                    : <>Save &amp; Next →</>}
                </button>
              </div>
              <div style={{ flex:1 }}/>
            </div>

          </div>{/* end form-card */}
        </form>
      </div>

      {/* ── Confirm Dialog */}
      {showConfirm && (
        <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
          <div style={{ background:'#fff',borderRadius:14,boxShadow:'0 20px 60px rgba(0,0,0,0.25)',width:'100%',maxWidth:460,overflow:'hidden',fontFamily:'inherit' }}>
            <div style={{ background:V.navy, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:'#fff', fontWeight:600, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>
                <i className="fas fa-exclamation-triangle" style={{ color:'#fbbf24' }}/> Confirm Admission Category
              </span>
              <button onClick={()=>setShowConfirm(false)} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>✕</button>
            </div>
            <div style={{ padding:'20px 24px', fontSize:14, color:'#374151', lineHeight:1.7 }}>
              As you don't have required certificates, Your Admission Category will be <strong>General / Open</strong>.<br/><br/>
              Are you sure, You want to Proceed?
            </div>
            <div style={{ padding:'12px 24px 20px', display:'flex', gap:12 }}>
              <button onClick={()=>setShowConfirm(false)} style={{ flex:1,padding:'9px 0',background:'#fff',border:`1.5px solid ${V.border}`,borderRadius:8,fontSize:14,fontWeight:600,color:'#374151',cursor:'pointer',fontFamily:'inherit' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}>No</button>
              <button onClick={doSave} style={{ flex:1,padding:'9px 0',background:V.primary,border:'none',borderRadius:8,fontSize:14,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}
                onMouseEnter={e=>e.currentTarget.style.background=V.primaryDark}
                onMouseLeave={e=>e.currentTarget.style.background=V.primary}>
                <i className="fas fa-check" style={{ fontSize:12 }}/> Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* scroll-to-top */}
      <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
        style={{ position:'fixed',bottom:28,right:28,width:44,height:44,borderRadius:'50%',background:'#f97316',color:'#fff',border:'none',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(249,115,22,0.4)',zIndex:50 }}>
        <i className="fas fa-chevron-up"/>
      </button>

      <style>{`
        @media(max-width:768px){.cat-grid-4,.yn-grid{grid-template-columns:1fr!important;}}
        @media(max-width:1024px) and (min-width:769px){.cat-grid-4{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>
    </div>
  )
}

// ── Sub section — teal header with left border bar (matches .sub-section-header)
function SubSection({ title, children }) {
  return (
    <div style={{ borderBottom:'1px solid #f1f5f9' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 24px', background:'#f0fdfb', borderBottom:'1px solid #ccfbf1' }}>
        <span style={{ width:3, height:14, background:'#059669', borderRadius:2, display:'inline-block', flexShrink:0 }}/>
        <span style={{ fontSize:12, fontWeight:700, color:'#0d9488', textTransform:'uppercase', letterSpacing:'0.06em' }}>{title}</span>
      </div>
      <div style={{ padding:'20px 24px' }}>{children}</div>
    </div>
  )
}

// ── Yes/No card item (matches .yn-item)
function YNCard({ label, name, value, onChange, error, required, fullWidth }) {
  return (
    <div style={{
      background:'#fff', border:`1.5px solid ${error?'#f87171':'#e2e8f0'}`,
      borderRadius:10, padding:'16px 18px',
      ...(fullWidth ? { gridColumn:'1/-1' } : {})
    }}>
      <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#0f172a', marginBottom:10, lineHeight:1.5 }}>
        {label} {required && <span style={{ color:'#ef4444' }}>*</span>}
      </label>
      <div style={{ display:'flex', gap:20 }}>
        {[{val:'1',lbl:'YES'},{val:'0',lbl:'NO'}].map(opt=>(
          <label key={opt.val} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, fontWeight:600, color:'#64748b' }}>
            <input type="radio" name={name} value={opt.val} checked={value===opt.val}
              onChange={onChange} style={{ accentColor:'#059669', width:15, height:15, margin:0, cursor:'pointer' }}/>
            {opt.lbl}
          </label>
        ))}
      </div>
      {error && (
        <p style={{ fontSize:11, color:'#ef4444', margin:'6px 0 0', display:'flex', alignItems:'center', gap:3 }}>
          <i className="fas fa-exclamation-circle" style={{ fontSize:10 }}/> {error}
        </p>
      )}
    </div>
  )
}

// ── pfield (label + input)
function PField({ label, required, error, children }) {
  return (
    <div className="pfield">
      <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:'#64748b', marginBottom:6 }}>
        {label} {required && <span style={{ color:'#ef4444' }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize:11, color:'#ef4444', margin:'4px 0 0', display:'flex', alignItems:'center', gap:3 }}>
          <i className="fas fa-exclamation-circle" style={{ fontSize:10 }}/> {error}
        </p>
      )}
    </div>
  )
}

function inpStyle(err) {
  return {
    width:'100%', padding:'9px 12px', border:`1.5px solid ${err?'#f87171':'#e2e8f0'}`,
    borderRadius:8, fontSize:13.5, color:'#0f172a', background:'#fff',
    boxSizing:'border-box', fontFamily:'inherit', outline:'none'
  }
}
function selStyle(err) { return { ...inpStyle(err), cursor:'pointer' } }
