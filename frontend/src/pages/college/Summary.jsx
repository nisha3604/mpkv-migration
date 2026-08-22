import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { collegeApi } from '../../services/api'

export default function CollegeSummary() {
  const { user, isAdmin }   = useAuth()
  const navigate            = useNavigate()
  const [searchParams]      = useSearchParams()
  const collegeIdQS         = searchParams.get('collegeId')
  const [college, setCollege] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [msg,     setMsg]     = useState('')

  useEffect(() => {
    collegeApi.getSummary(collegeIdQS)
      .then(res => setCollege(res.data.college))
      .catch(() => setError('Failed to load college details.'))
      .finally(() => setLoading(false))
  }, [collegeIdQS])

  const handleToggle = async () => {
    const fn = college.isActive ? collegeApi.deactivate : collegeApi.activate
    try {
      const res = await fn(college.collegeID)
      if (res.data.success) { setCollege(p => ({ ...p, isActive: !p.isActive })); setMsg(res.data.message) }
      else setError(res.data.message)
    } catch { setError('Action failed.') }
  }

  const V = { navy: '#14212e', primary: '#059669', border: '#e2e8f0', bg: '#f5f6fa', teal: '#0d9488', textSecond: '#64748b' }

  const Field = ({ label, value }) => (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: V.textSecond, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{value || '—'}</p>
    </div>
  )

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ fontSize: 12, fontWeight: 700, color: V.teal, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, borderLeft: '3px solid #0d9488', paddingLeft: 10 }}>{title}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>{children}</div>
    </div>
  )

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:24 }}>
      {(error||msg) && <div style={{ background:error?'#fef2f2':'#f0fdf9', border:`1px solid ${error?'#fecaca':'#bbf7d0'}`, color:error?'#dc2626':'#065f46', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13 }}>{error||msg}</div>}

      <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ background:V.navy, padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ color:'#fff', fontWeight:700, fontSize:16, margin:0 }}>College Summary</h3>
          <span style={{ background:college?.isActive?'#059669':'#dc2626', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
            {college?.isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
        <div style={{ padding:24 }}>
          <Section title="College Information">
            <Field label="College Code"  value={college?.collegeCode}    />
            <Field label="College Name"  value={college?.collegeName}    />
            <Field label="District"      value={college?.district}       />
            <Field label="Taluka"        value={college?.taluka}         />
            <Field label="City"          value={college?.city}           />
            <Field label="Pincode"       value={college?.pincode}        />
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Address"     value={college?.collegeAddress} />
            </div>
            <Field label="Mobile No"     value={college?.mobileNo}       />
            <Field label="Email ID"      value={college?.emailID}        />
          </Section>
          <Section title="Course Information">
            <Field label="Course"              value={college?.course}               />
            <Field label="Course Status"       value={college?.courseStatus}         />
            <Field label="Intake"              value={college?.intake}               />
            <Field label="Management Quota"    value={college?.hasManagementQuota}   />
          </Section>
          <Section title="Principal Details">
            <Field label="Name"   value={college?.principalName}    />
            <Field label="Email"  value={college?.principalEmailID} />
            <Field label="Mobile" value={college?.principalMobileNo}/>
          </Section>
          <Section title="Admission Incharge Details">
            <Field label="Name"   value={college?.admissionInchargeName}     />
            <Field label="Email"  value={college?.admissionInchargeEmailID}  />
            <Field label="Mobile" value={college?.admissionInchargeMobileNo} />
          </Section>
        </div>
        <div style={{ padding:'14px 24px', borderTop:`1px solid ${V.border}`, background:'#f8fafc', display:'flex', gap:10, justifyContent:'center' }}>
          {isAdmin && (
            <button onClick={() => navigate('/admin/college/list')}
              style={{ background:'transparent', border:`1.5px solid ${V.border}`, color:'#374151', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              ← Back to List
            </button>
          )}
          <button onClick={() => navigate(collegeIdQS ? `/admin/college/edit?collegeId=${collegeIdQS}` : '/college/edit')}
            style={{ background:V.primary, color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Edit College Info
          </button>
          {isAdmin && (
            <button onClick={handleToggle}
              style={{ background:college?.isActive?'#dc2626':'#059669', color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {college?.isActive ? 'Deactivate' : 'Activate'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
