import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { collegeApi } from '../../services/api'

export default function EditCollegeDetails() {
  const { user, isAdmin }   = useAuth()
  const navigate            = useNavigate()
  const [searchParams]      = useSearchParams()
  const collegeIdQS         = searchParams.get('collegeId')
  const [masters, setMasters] = useState({ districts:[], courses:[], courseStatuses:[] })
  const [form,    setForm]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    collegeApi.getDetails(collegeIdQS)
      .then(res => {
        const d = res.data.details ?? {}
        setForm({
          collegeCode: d.collegeCode ?? '', collegeName: d.collegeName ?? '',
          collegeAddress: d.collegeAddress ?? '', districtID: d.districtID ?? 0,
          taluka: d.taluka ?? '', city: d.city ?? '', pincode: d.pincode ?? '',
          mobileNo: d.mobileNo ?? '', emailID: d.emailID ?? '',
          courseID: d.courseID ?? 0, courseStatusID: d.courseStatusID ?? 0,
          intake: d.intake ?? 0, hasManagementQuota: d.hasManagementQuotaValue ?? 0,
          principalName: d.principalName ?? '', principalEmailID: d.principalEmailID ?? '', principalMobileNo: d.principalMobileNo ?? '',
          admissionInchargeName: d.admissionInchargeName ?? '', admissionInchargeEmailID: d.admissionInchargeEmailID ?? '', admissionInchargeMobileNo: d.admissionInchargeMobileNo ?? '',
        })
        setMasters({ districts: res.data.districts ?? [], courses: res.data.courses ?? [], courseStatuses: res.data.courseStatuses ?? [] })
      })
      .catch(() => setError('Failed to load college details.'))
      .finally(() => setLoading(false))
  }, [collegeIdQS])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await collegeApi.save(form, collegeIdQS)
      if (res.data.success) {
        setSuccess(res.data.message)
        setTimeout(() => navigate(collegeIdQS ? `/admin/college/summary?collegeId=${collegeIdQS}` : '/college/summary'), 1200)
      } else setError(res.data.message)
    } catch (err) { setError(err.response?.data?.message ?? 'Save failed.') }
    finally { setSaving(false) }
  }

  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', bg:'#f5f6fa', teal:'#0d9488' }
  const inp = (disabled) => ({ width:'100%', padding:'9px 12px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:14, fontFamily:'inherit', background:disabled?'#f1f5f9':'#fff', color:disabled?'#94a3b8':'#0f172a', boxSizing:'border-box' })
  const Fld = ({ label, name, required, disabled, children }) => (
    <div>
      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>{label}{required && <span style={{ color:'#ef4444' }}> *</span>}</label>
      {children || <input name={name} value={form?.[name]??''} onChange={handleChange} disabled={disabled} style={inp(disabled)} />}
    </div>
  )
  const Sec = ({ title, children }) => (
    <div style={{ marginBottom:24 }}>
      <h4 style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14, borderLeft:'3px solid #0d9488', paddingLeft:10 }}>{title}</h4>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px 16px' }}>{children}</div>
    </div>
  )

  if (loading||!form) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:24 }}>
      {(error||success) && <div style={{ background:error?'#fef2f2':'#f0fdf9', border:`1px solid ${error?'#fecaca':'#bbf7d0'}`, color:error?'#dc2626':'#065f46', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13 }}>{error||success}</div>}
      <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ background:V.navy, padding:'16px 24px' }}><h3 style={{ color:'#fff', fontWeight:700, fontSize:16, margin:0 }}>Edit College Details</h3></div>
        <div style={{ padding:24 }}>
          <Sec title="College Information">
            <Fld label="College Code" name="collegeCode" required disabled={!isAdmin||!!form.collegeCode} />
            <Fld label="College Name" name="collegeName" required disabled={!isAdmin} />
            <Fld label="District" name="districtID" disabled={!isAdmin}>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>District *</label>
              <select name="districtID" value={form.districtID} onChange={handleChange} disabled={!isAdmin} style={inp(!isAdmin)}>
                <option value={0}>-- Select District --</option>
                {masters.districts.map(d => <option key={d.value} value={d.value}>{d.text}</option>)}
              </select>
            </Fld>
            <Fld label="Taluka"  name="taluka"  required />
            <Fld label="City"    name="city"    required />
            <Fld label="Pincode" name="pincode" required />
            <div style={{ gridColumn:'1/-1' }}><Fld label="College Address" name="collegeAddress" required /></div>
            <Fld label="Mobile No" name="mobileNo" required />
            <Fld label="Email ID"  name="emailID"  required />
          </Sec>
          <Sec title="Course Information">
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Course</label>
              <select name="courseID" value={form.courseID} onChange={handleChange} disabled={!isAdmin} style={inp(!isAdmin)}>
                <option value={0}>-- Select Course --</option>
                {masters.courses.map(c => <option key={c.value} value={c.value}>{c.text}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Course Status</label>
              <select name="courseStatusID" value={form.courseStatusID} onChange={handleChange} disabled={!isAdmin} style={inp(!isAdmin)}>
                <option value={0}>-- Select Status --</option>
                {masters.courseStatuses.map(s => <option key={s.value} value={s.value}>{s.text}</option>)}
              </select>
            </div>
            <Fld label="Intake" name="intake" disabled={!isAdmin} />
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Management Quota</label>
              <select name="hasManagementQuota" value={form.hasManagementQuota} onChange={handleChange} disabled={!isAdmin} style={inp(!isAdmin)}>
                <option value={0}>NO</option>
                <option value={1}>YES</option>
              </select>
            </div>
          </Sec>
          <Sec title="Principal Details">
            <Fld label="Principal Name"   name="principalName"    required />
            <Fld label="Principal Email"  name="principalEmailID" required />
            <Fld label="Principal Mobile" name="principalMobileNo" required />
          </Sec>
          <Sec title="Admission Incharge Details">
            <Fld label="Name"   name="admissionInchargeName"      required />
            <Fld label="Email"  name="admissionInchargeEmailID"   required />
            <Fld label="Mobile" name="admissionInchargeMobileNo"  required />
          </Sec>
        </div>
        <div style={{ padding:'14px 24px', borderTop:`1px solid ${V.border}`, background:'#f8fafc', display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={() => navigate(-1)} style={{ background:'transparent', border:`1.5px solid ${V.border}`, color:'#374151', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
          <button onClick={handleSave} disabled={saving} style={{ background:saving?'#d1fae5':V.primary, color:'#fff', border:'none', borderRadius:8, padding:'9px 24px', fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit' }}>
            {saving ? 'Saving...' : 'Save →'}
          </button>
        </div>
      </div>
    </div>
  )
}
