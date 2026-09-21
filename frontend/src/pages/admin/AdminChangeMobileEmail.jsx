import { useState } from 'react'
import { candidateUtilsApi } from '../../services/api'

/**
 * AdminChangeMobileEmail
 *
 * Mirrors Admin/CheckApplicationID.aspx?Flag=ChangeMobileEMail
 *       + Candidate/ChangeMobileEMail.aspx  (exact same UI)
 *
 * Step 1 — CheckApplicationID: single card, enter Application ID, Search button
 * Step 2 — ChangeMobileEMail:  two side-by-side cards (Change Mobile | Change Email)
 *           each with a single input + full-width ▶ button + inline message
 *
 * No OTP. Direct admin override. Duplicate check done server-side.
 */
export default function AdminChangeMobileEmail() {

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [appId,     setAppId]     = useState('')
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [candidate, setCandidate] = useState(null) // { applicationId } — set after valid search

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [newMobile,   setNewMobile]   = useState('')
  const [mobileErr,   setMobileErr]   = useState('')
  const [savingMob,   setSavingMob]   = useState(false)
  const [mobMsg,      setMobMsg]      = useState(null)  // { text, ok }

  const [newEmail,    setNewEmail]    = useState('')
  const [emailErr,    setEmailErr]    = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailMsg,    setEmailMsg]    = useState(null)  // { text, ok }

  // ── Step 1: resolve Application ID ────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!appId.trim()) { setSearchErr('Please Enter Application ID.'); return }
    setSearching(true); setSearchErr('')
    setCandidate(null); setMobMsg(null); setEmailMsg(null)
    setNewMobile(''); setNewEmail('')
    try {
      // Use getApplication to validate — if it returns success, the appId is valid
      const res = await candidateUtilsApi.getApplication(appId.trim())
      if (res.data?.success && res.data?.data) {
        const p = res.data.data?.personal ?? {}
        setCandidate({
          applicationId:  appId.trim().toUpperCase(),
          candidateName:  p.candidateName || appId.trim().toUpperCase(),
        })
      } else {
        setSearchErr('Invalid Application ID.')
      }
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400)
        setSearchErr('Invalid Application ID.')
      else
        setSearchErr('Server error. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  // ── Step 2a: Change Mobile Number ─────────────────────────────────────────
  const handleChangeMobile = async (e) => {
    e.preventDefault()
    setMobileErr(''); setMobMsg(null)
    if (!newMobile.trim()) { setMobileErr('Please Enter Mobile Number.'); return }
    if (!/^[6-9]\d{9}$/.test(newMobile.trim())) { setMobileErr('Mobile Number Should be Proper and of 10 Digits.'); return }
    setSavingMob(true)
    try {
      const res = await candidateUtilsApi.changeMobileEmail({
        applicationId: candidate.applicationId,
        newMobile: newMobile.trim(),
        newEmail: null,
      })
      setMobMsg({ text: res.data.message, ok: res.data.success })
      if (res.data.success) setNewMobile('')
    } catch {
      setMobMsg({ text: 'Server error. Please try again.', ok: false })
    } finally {
      setSavingMob(false)
    }
  }

  // ── Step 2b: Change E-Mail ID ─────────────────────────────────────────────
  const handleChangeEmail = async (e) => {
    e.preventDefault()
    setEmailErr(''); setEmailMsg(null)
    if (!newEmail.trim()) { setEmailErr('Please Enter E-Mail ID.'); return }
    if (!/\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(newEmail.trim())) { setEmailErr('Please Enter Valid E-Mail ID.'); return }
    setSavingEmail(true)
    try {
      const res = await candidateUtilsApi.changeMobileEmail({
        applicationId: candidate.applicationId,
        newMobile: null,
        newEmail: newEmail.trim(),
      })
      setEmailMsg({ text: res.data.message, ok: res.data.success })
      if (res.data.success) setNewEmail('')
    } catch {
      setEmailMsg({ text: 'Server error. Please try again.', ok: false })
    } finally {
      setSavingEmail(false)
    }
  }

  // ── Shared styles matching old project theme ──────────────────────────────
  const navy    = '#14212e'
  const primary = '#059669'
  const border  = '#e2e8f0'
  const bg      = '#f5f6fa'

  const Alert = ({ msg, onClose }) => {
    if (!msg) return null
    const ok = msg.ok
    return (
      <div style={{
        margin: '12px 0 0', padding: '10px 14px', borderRadius: 8, fontSize: 13,
        display: 'flex', alignItems: 'flex-start', gap: 8,
        background: ok ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${ok ? '#86efac' : '#fecaca'}`,
        color:  ok ? '#166534' : '#dc2626',
      }}>
        <i className={`fas ${ok ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{ marginTop: 1, flexShrink: 0 }}/>
        <span style={{ flex: 1 }}>{msg.text}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
      </div>
    )
  }

  const inputStyle = (hasErr) => ({
    width: '100%', padding: '10px 14px 10px 34px', boxSizing: 'border-box',
    border: `1.5px solid ${hasErr ? '#dc2626' : border}`,
    borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit',
    color: '#0f172a', background: '#fff', outline: 'none',
    transition: 'border-color .2s',
  })

  return (
    <div style={{ padding: 24, background: bg, minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* ── STEP 1: CheckApplicationID card ─────────────────────────────── */}
      {!candidate && (
        <div style={{ maxWidth: 560, margin: '0 auto', border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.06)', background: '#fff' }}>

          {/* Card header — activity name */}
          <div style={{ background: navy, padding: '12px 20px' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
              Change Mobile No. / E-Mail ID
            </span>
          </div>

          {/* Card body */}
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            {searchErr && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '9px 14px', marginBottom: 16, fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-exclamation-circle"/>{searchErr}
              </div>
            )}
            <form onSubmit={handleSearch}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>Application ID :</label>
                <input
                  value={appId}
                  onChange={e => { setAppId(e.target.value.toUpperCase()); setSearchErr('') }}
                  placeholder="Enter Application ID"
                  maxLength={15}
                  style={{ padding: '7px 12px', border: `1px solid ${border}`, borderRadius: 6, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', width: 200 }}
                  onFocus={e => e.target.style.borderColor = primary}
                  onBlur={e => e.target.style.borderColor = border}
                />
              </div>
            </form>
          </div>

          {/* Card footer */}
          <div style={{ background: '#f8fafc', borderTop: `1px solid ${border}`, padding: '14px 20px', textAlign: 'center' }}>
            <button
              onClick={handleSearch}
              disabled={searching}
              style={{ background: searching ? '#d1fae5' : primary, color: '#fff', border: 'none', padding: '8px 28px', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: searching ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minWidth: 100 }}>
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: ChangeMobileEMail — two cards side by side ───────────── */}
      {candidate && (
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Page title — mirrors cme-title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, background: '#f0fdfb', border: `1.5px solid #ccfbf1`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fas fa-address-card" style={{ color: primary, fontSize: 18 }}/>
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Change Mobile Number / E-Mail ID</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Application ID: <strong>{candidate.applicationId}</strong>
                {candidate.candidateName && candidate.candidateName !== candidate.applicationId && (
                  <> · <strong>{candidate.candidateName}</strong></>
                )}
                &nbsp;·&nbsp;
                <button onClick={() => setCandidate(null)} style={{ background: 'none', border: 'none', color: primary, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, padding: 0, textDecoration: 'underline' }}>
                  Search again
                </button>
              </p>
            </div>
          </div>

          {/* Two cards side by side — mirrors cme-grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* ── Change Mobile Number card ─────────────────────────────── */}
            <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
              {/* cme-card-header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: navy }}>
                <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fas fa-mobile-alt" style={{ color: '#fff', fontSize: 14 }}/>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Change Mobile Number</span>
              </div>

              {/* cme-card-body */}
              <div style={{ padding: 20 }}>
                <form onSubmit={handleChangeMobile}>
                  {/* cme-field */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                      Enter Mobile Number <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>
                    </label>
                    {/* cme-input-wrap */}
                    <div style={{ position: 'relative' }}>
                      <i className="fas fa-mobile-alt" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13, pointerEvents: 'none' }}/>
                      <input
                        type="text"
                        value={newMobile}
                        onChange={e => { setNewMobile(e.target.value.replace(/\D/g, '')); setMobileErr(''); setMobMsg(null) }}
                        placeholder="Enter Mobile Number"
                        maxLength={10}
                        style={inputStyle(!!mobileErr)}
                        onFocus={e => e.target.style.borderColor = primary}
                        onBlur={e => e.target.style.borderColor = mobileErr ? '#dc2626' : border}
                      />
                    </div>
                    {mobileErr && <p style={{ fontSize: 12, color: '#dc2626', margin: '5px 0 0' }}>{mobileErr}</p>}
                  </div>

                  {/* cme-btn */}
                  <button
                    type="submit"
                    disabled={savingMob}
                    style={{ width: '100%', padding: '12px', background: savingMob ? '#d1fae5' : primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: savingMob ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(5,150,105,.25)', fontFamily: 'inherit' }}
                    onMouseEnter={e => { if (!savingMob) e.currentTarget.style.background = '#047857' }}
                    onMouseLeave={e => { if (!savingMob) e.currentTarget.style.background = primary }}>
                    {savingMob
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                      : <><i className="fas fa-chevron-right" style={{ fontSize: 12 }}/>Change Mobile Number</>}
                  </button>

                  <Alert msg={mobMsg} onClose={() => setMobMsg(null)}/>
                </form>
              </div>
            </div>

            {/* ── Change E-Mail ID card ────────────────────────────────── */}
            <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
              {/* cme-card-header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: navy }}>
                <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fas fa-envelope" style={{ color: '#fff', fontSize: 14 }}/>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Change E-Mail ID</span>
              </div>

              {/* cme-card-body */}
              <div style={{ padding: 20 }}>
                <form onSubmit={handleChangeEmail}>
                  {/* cme-field */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                      Enter E-Mail ID <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>
                    </label>
                    {/* cme-input-wrap */}
                    <div style={{ position: 'relative' }}>
                      <i className="fas fa-at" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13, pointerEvents: 'none' }}/>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={e => { setNewEmail(e.target.value); setEmailErr(''); setEmailMsg(null) }}
                        placeholder="Enter E-Mail ID"
                        maxLength={100}
                        autoCapitalize="none"
                        autoCorrect="off"
                        style={{ ...inputStyle(!!emailErr), textTransform: 'none' }}
                        onFocus={e => e.target.style.borderColor = primary}
                        onBlur={e => e.target.style.borderColor = emailErr ? '#dc2626' : border}
                      />
                    </div>
                    {emailErr && <p style={{ fontSize: 12, color: '#dc2626', margin: '5px 0 0' }}>{emailErr}</p>}
                  </div>

                  {/* cme-btn */}
                  <button
                    type="submit"
                    disabled={savingEmail}
                    style={{ width: '100%', padding: '12px', background: savingEmail ? '#d1fae5' : primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: savingEmail ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(5,150,105,.25)', fontFamily: 'inherit' }}
                    onMouseEnter={e => { if (!savingEmail) e.currentTarget.style.background = '#047857' }}
                    onMouseLeave={e => { if (!savingEmail) e.currentTarget.style.background = primary }}>
                    {savingEmail
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                      : <><i className="fas fa-chevron-right" style={{ fontSize: 12 }}/>Change E-Mail ID</>}
                  </button>

                  <Alert msg={emailMsg} onClose={() => setEmailMsg(null)}/>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
