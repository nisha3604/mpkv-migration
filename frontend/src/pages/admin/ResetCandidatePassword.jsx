import { useState } from 'react'
import { candidateUtilsApi } from '../../services/api'

/**
 * ResetCandidatePassword — mirrors Admin/ResetCandidatePassword.aspx.
 *
 * Flow:
 *  1. Enter Application ID → Search → shows candidate name + current password (decoded)
 *  2. Enter New Password + Confirm Password → Change Password button
 *
 * SPs: Base_GetCandidateID, Base_GetCandidateName, Account_GetUserPassword,
 *      Account_ResetPassword
 */
export default function ResetCandidatePassword() {
  const [appId,    setAppId]    = useState('')
  const [info,     setInfo]     = useState(null)   // CandidatePasswordInfoResponse
  const [searching,setSearching]= useState(false)
  const [searchErr,setSearchErr]= useState('')
  const [newPwd,   setNewPwd]   = useState('')
  const [confPwd,  setConfPwd]  = useState('')
  const [showNew,  setShowNew]  = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState({ text:'', ok:true })

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!appId.trim()) { setSearchErr('Please Enter Application ID.'); return }
    setSearching(true); setSearchErr(''); setInfo(null); setMsg({ text:'', ok:true })
    setNewPwd(''); setConfPwd('')
    try {
      const res = await candidateUtilsApi.getPasswordInfo(appId.trim().toUpperCase())
      if (res.data.success) setInfo(res.data)
      else setSearchErr(res.data.message || 'Invalid Application ID.')
    } catch { setSearchErr('Search failed. Please try again.') }
    finally { setSearching(false) }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!newPwd.trim())               { setMsg({ text:'Please Enter New Password.', ok:false }); return }
    if (newPwd !== confPwd)           { setMsg({ text:'Password and Confirm Password should be the same.', ok:false }); return }
    if (newPwd.length < 8 || newPwd.length > 15) { setMsg({ text:'Password must be 8-15 characters.', ok:false }); return }
    setSaving(true); setMsg({ text:'', ok:true })
    try {
      const res = await candidateUtilsApi.resetPassword({
        candidateID    : info.candidateID,
        applicationID  : info.applicationID,
        newPassword    : newPwd,
        confirmPassword: confPwd,
      })
      if (res.data.success) {
        setMsg({ text: res.data.message, ok: true })
        setNewPwd(''); setConfPwd('')
        // Refresh to show new current password
        const r2 = await candidateUtilsApi.getPasswordInfo(info.applicationID)
        if (r2.data.success) setInfo(r2.data)
      } else setMsg({ text: res.data.message || 'Reset failed.', ok: false })
    } catch { setMsg({ text:'Reset failed. Please try again.', ok:false }) }
    finally { setSaving(false) }
  }

  const V = { navy:'#14212e', primary:'#059669', danger:'#dc2626', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d' }
  const cardHeader = (text) => (
    <div style={{ background:V.navy, padding:'10px 18px', borderRadius:'8px 8px 0 0' }}>
      <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>{text}</h5>
    </div>
  )
  const inp = (extra) => ({
    width:'100%', padding:'7px 10px', border:`1px solid ${V.border}`, borderRadius:5,
    fontSize:13.5, fontFamily:'inherit', outline:'none', boxSizing:'border-box', ...extra
  })
  const lbl = (text, req) => (
    <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#212529', marginBottom:5 }}>
      {text}{req && <span style={{ color:V.danger, marginLeft:2 }}>*</span>}
    </label>
  )

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:860, margin:'0 auto' }}>

        {/* Step 1 — Search */}
        <div style={{ border:`1px solid ${V.border}`, borderRadius:8, marginBottom:20, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
          {cardHeader('Reset Candidate Password')}
          <div style={{ padding:'20px', background:V.white }}>
            <form onSubmit={handleSearch}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'flex-end' }}>
                <div>
                  {lbl('Application ID', true)}
                  <input value={appId} onChange={e => setAppId(e.target.value.toUpperCase())}
                    placeholder="Enter Application ID"
                    style={inp({})}
                    onFocus={e=>e.target.style.borderColor=V.primary}
                    onBlur={e=>e.target.style.borderColor=V.border}/>
                  {searchErr && <div style={{ color:V.danger, fontSize:12, marginTop:4 }}>{searchErr}</div>}
                </div>
                <button type="submit" disabled={searching}
                  style={{ background:searching?'#d1fae5':V.primary, color:'#fff', border:'none', padding:'8px 24px', borderRadius:5, fontSize:13.5, fontWeight:700, cursor:searching?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8, marginBottom:searchErr?20:0 }}>
                  {searching ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Searching...</> : <><i className="fas fa-search"/>Search</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Step 2 — Reset form (shown after search) */}
        {info && (
          <div style={{ border:`1px solid ${V.border}`, borderRadius:8, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
            {cardHeader('Change Password')}
            <div style={{ padding:'20px', background:V.white }}>

              {msg.text && (
                <div style={{ background:msg.ok?'#d1e7dd':'#f8d7da', border:`1px solid ${msg.ok?'#badbcc':'#f5c2c7'}`, color:msg.ok?'#0f5132':'#842029', borderRadius:5, padding:'9px 14px', marginBottom:16, fontSize:13 }}>
                  <i className={`fas ${msg.ok?'fa-check-circle':'fa-exclamation-circle'}`} style={{ marginRight:6 }}/>{msg.text}
                </div>
              )}

              {/* Candidate info (read-only) */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:20 }}>
                <div>
                  {lbl('User Name')}
                  <input value={info.candidateName} readOnly style={inp({ background:'#f8f9fa', color:V.muted })}/>
                </div>
                <div>
                  {lbl('Application ID')}
                  <input value={info.applicationID} readOnly style={inp({ background:'#f8f9fa', color:V.muted })}/>
                </div>
                <div>
                  {lbl('Current Password')}
                  <input value={info.currentPassword} readOnly style={inp({ background:'#f8f9fa', color:V.muted, fontFamily:'monospace' })}/>
                </div>
              </div>

              {/* Password fields */}
              <div style={{ background:'#f8f9fa', border:`1px solid ${V.border}`, borderRadius:6, padding:'16px', marginBottom:6 }}>
                <p style={{ fontSize:12, color:V.muted, margin:'0 0 14px', fontStyle:'italic' }}>
                  Password rules: 8–15 characters, must include uppercase, lowercase, digit and special character.
                </p>
                <form onSubmit={handleReset}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
                    <div>
                      {lbl('New Password', true)}
                      <div style={{ position:'relative' }}>
                        <input type={showNew?'text':'password'} value={newPwd} onChange={e=>setNewPwd(e.target.value)}
                          placeholder="New password" style={inp({ paddingRight:36 })}
                          onFocus={e=>e.target.style.borderColor=V.primary} onBlur={e=>e.target.style.borderColor=V.border}/>
                        <button type="button" onClick={()=>setShowNew(v=>!v)}
                          style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:V.muted, fontSize:14 }}>
                          <i className={`fas ${showNew?'fa-eye-slash':'fa-eye'}`}/>
                        </button>
                      </div>
                    </div>
                    <div>
                      {lbl('Confirm Password', true)}
                      <div style={{ position:'relative' }}>
                        <input type={showConf?'text':'password'} value={confPwd} onChange={e=>setConfPwd(e.target.value)}
                          placeholder="Confirm password" style={inp({ paddingRight:36 })}
                          onFocus={e=>e.target.style.borderColor=V.primary} onBlur={e=>e.target.style.borderColor=V.border}/>
                        <button type="button" onClick={()=>setShowConf(v=>!v)}
                          style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:V.muted, fontSize:14 }}>
                          <i className={`fas ${showConf?'fa-eye-slash':'fa-eye'}`}/>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <button type="submit" disabled={saving}
                      style={{ background:saving?'#d1fae5':V.primary, color:'#fff', border:'none', padding:'9px 36px', borderRadius:6, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8 }}
                      onMouseEnter={e=>{ if(!saving) e.currentTarget.style.background='#047857' }}
                      onMouseLeave={e=>{ if(!saving) e.currentTarget.style.background=saving?'#d1fae5':V.primary }}>
                      {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Changing...</> : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
