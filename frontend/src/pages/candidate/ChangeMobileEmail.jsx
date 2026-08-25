import { useState } from 'react'
import { accountApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * Change Mobile / E-Mail — mirrors ChangeMobileEMail.aspx exactly.
 * Two separate sections on one page — change mobile and change email.
 * SPs: Account_ChangeCandidateMobileNo, Account_ChangeCandidateEMailID
 */
export default function ChangeMobileEmail() {
  const { user } = useAuth()

  const [mobile,        setMobile]        = useState('')
  const [email,         setEmail]         = useState('')
  const [mobileErr,     setMobileErr]     = useState('')
  const [emailErr,      setEmailErr]      = useState('')
  const [mobileSuccess, setMobileSuccess] = useState('')
  const [emailSuccess,  setEmailSuccess]  = useState('')
  const [savingMobile,  setSavingMobile]  = useState(false)
  const [savingEmail,   setSavingEmail]   = useState(false)

  const V = {
    navy: '#14212e', primary: '#059669', primaryDark: '#047857',
    teal: '#0d9488', tealLight: '#f0fdfb', tealBorder: '#ccfbf1',
    border: '#e2e8f0', textSecond: '#64748b', textPrimary: '#0f172a',
    danger: '#ef4444', bg: '#f5f6fa',
  }

  const inp = hasErr => ({
    width: '100%', padding: '10px 12px',
    border: `1.5px solid ${hasErr ? V.danger : V.border}`,
    borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: V.textPrimary,
  })

  const SecHeader = ({ icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: V.tealLight, borderBottom: `1px solid ${V.tealBorder}` }}>
      <span style={{ width: 3, height: 14, background: V.primary, borderRadius: 2, flexShrink: 0 }}/>
      <i className={icon} style={{ color: V.teal, fontSize: 13 }}/>
      <span style={{ fontSize: 12, fontWeight: 700, color: V.teal, textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</span>
    </div>
  )

  const handleChangeMobile = async e => {
    e.preventDefault()
    setMobileErr(''); setMobileSuccess('')
    if (!mobile.trim())              { setMobileErr('Please enter a mobile number.'); return }
    if (!/^\d{10}$/.test(mobile.trim())) { setMobileErr('Enter a valid 10-digit mobile number.'); return }
    setSavingMobile(true)
    try {
      const res = await accountApi.changeMobile({ newMobileNo: mobile.trim() })
      if (res.data.success) { setMobileSuccess(res.data.message); setMobile('') }
      else setMobileErr(res.data.message)
    } catch (err) {
      setMobileErr(err.response?.data?.message ?? 'Failed to change mobile number.')
    } finally { setSavingMobile(false) }
  }

  const handleChangeEmail = async e => {
    e.preventDefault()
    setEmailErr(''); setEmailSuccess('')
    if (!email.trim()) { setEmailErr('Please enter an E-Mail ID.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailErr('Enter a valid E-Mail ID.'); return }
    setSavingEmail(true)
    try {
      const res = await accountApi.changeEmail({ newEmailId: email.trim() })
      if (res.data.success) { setEmailSuccess(res.data.message); setEmail('') }
      else setEmailErr(res.data.message)
    } catch (err) {
      setEmailErr(err.response?.data?.message ?? 'Failed to change E-Mail ID.')
    } finally { setSavingEmail(false) }
  }

  return (
    <div style={{ fontFamily: 'inherit', background: V.bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* header */}
          <div style={{ background: V.navy, padding: '16px 24px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
              <i className="fas fa-user-edit" style={{ marginRight: 8 }}/>Change Mobile / E-Mail ID
            </h3>
          </div>

          {/* ── Change Mobile Number ───────────────────────────────── */}
          <SecHeader icon="fas fa-mobile-alt" title="Change Mobile Number"/>
          <div style={{ padding: '20px 24px' }}>
            {mobileErr     && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}><i className="fas fa-exclamation-circle" style={{ marginRight: 6 }}/>{mobileErr}</div>}
            {mobileSuccess && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}><i className="fas fa-check-circle" style={{ marginRight: 6 }}/>{mobileSuccess}</div>}
            <form onSubmit={handleChangeMobile} noValidate>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: V.textSecond, marginBottom: 6 }}>
                New Mobile Number <span style={{ color: V.danger }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flex: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: '#f1f5f9', border: `1.5px solid ${V.border}`, borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: 13, color: V.textSecond, fontWeight: 600 }}>+91</span>
                  <input
                    type="tel" value={mobile} maxLength={10}
                    onChange={e => { setMobile(e.target.value.replace(/\D/g,'')); setMobileErr(''); setMobileSuccess('') }}
                    placeholder="10-digit mobile number"
                    style={{ ...inp(!!mobileErr), borderRadius: '0 8px 8px 0', flex: 1 }}
                  />
                </div>
                <button type="submit" disabled={savingMobile}
                  style={{ background: savingMobile ? '#e2e8f0' : V.primary, color: savingMobile ? '#6b7280' : '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: savingMobile ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
                  onMouseEnter={e => { if (!savingMobile) e.currentTarget.style.background = V.primaryDark }}
                  onMouseLeave={e => { if (!savingMobile) e.currentTarget.style.background = V.primary }}>
                  {savingMobile ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</> : 'Change Mobile No'}
                </button>
              </div>
            </form>
          </div>

          {/* ── Change E-Mail ID ───────────────────────────────────── */}
          <SecHeader icon="fas fa-envelope" title="Change E-Mail ID"/>
          <div style={{ padding: '20px 24px' }}>
            {emailErr     && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}><i className="fas fa-exclamation-circle" style={{ marginRight: 6 }}/>{emailErr}</div>}
            {emailSuccess && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}><i className="fas fa-check-circle" style={{ marginRight: 6 }}/>{emailSuccess}</div>}
            <form onSubmit={handleChangeEmail} noValidate>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: V.textSecond, marginBottom: 6 }}>
                New E-Mail ID <span style={{ color: V.danger }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setEmailErr(''); setEmailSuccess('') }}
                  placeholder="example@email.com"
                  style={{ ...inp(!!emailErr), flex: 1 }}
                />
                <button type="submit" disabled={savingEmail}
                  style={{ background: savingEmail ? '#e2e8f0' : V.primary, color: savingEmail ? '#6b7280' : '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: savingEmail ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
                  onMouseEnter={e => { if (!savingEmail) e.currentTarget.style.background = V.primaryDark }}
                  onMouseLeave={e => { if (!savingEmail) e.currentTarget.style.background = V.primary }}>
                  {savingEmail ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</> : 'Change E-Mail ID'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
