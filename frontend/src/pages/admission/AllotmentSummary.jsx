import { useState, useEffect } from 'react'
import { admissionApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * Allotment / Admission Summary — mirrors AllotmentSummary.aspx exactly.
 *
 * For candidate (UserTypeID=91): auto-loads on mount using JWT CandidateID.
 * Shows: Application ID, Candidate Name + table of all allotments per round.
 * SP: Admission_GetAllotmentSummary(@CandidateID)
 */
export default function AllotmentSummary() {
  const { user } = useAuth()

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const V = { navy:'#14212e', primary:'#059669', teal:'#0d9488', tealLight:'#f0fdfb', tealBorder:'#ccfbf1', border:'#e2e8f0', borderLight:'#f1f5f9', textSecond:'#64748b', textPrimary:'#0f172a', bg:'#f5f6fa' }

  useEffect(() => {
    admissionApi.getAllotmentSummary()
      .then(res => {
        if (res.data.success) setData(res.data)
        else setError(res.data.message || 'No allotment data found.')
      })
      .catch(err => setError(err.response?.data?.message ?? 'Failed to load allotment summary.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:V.textSecond, fontSize:14 }}>Loading allotment summary...</p>
      </div>
    </div>
  )

  const Th = ({ children }) => (
    <th style={{ padding:'11px 14px', fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.04em', textAlign:'left', whiteSpace:'nowrap', background:V.navy }}>{children}</th>
  )
  const Td = ({ children, center }) => (
    <td style={{ padding:'11px 14px', fontSize:13, color:V.textPrimary, borderBottom:`1px solid ${V.borderLight}`, textAlign: center ? 'center' : 'left' }}>{children || '—'}</td>
  )

  const statusColor = status => {
    if (!status) return V.textSecond
    const s = status.toLowerCase()
    if (s.includes('admit')) return '#166534'
    if (s.includes('refus') || s.includes('cancel')) return '#dc2626'
    return V.textSecond
  }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 24px 40px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{error}
          </div>
        )}

        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* header */}
          <div style={{ background:V.navy, padding:'16px 24px' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>
              <i className="fas fa-list-alt" style={{ marginRight:8 }}/>Allotment / Admission Summary
            </h3>
          </div>

          {data ? (
            <>
              {/* candidate info */}
              <div style={{ padding:'16px 24px', background:V.tealLight, borderBottom:`1px solid ${V.tealBorder}`, display:'flex', gap:32, flexWrap:'wrap' }}>
                <div>
                  <span style={{ fontSize:11, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>Application ID</span>
                  <div style={{ fontSize:15, fontWeight:700, color:V.primary, marginTop:2 }}>{data.applicationID}</div>
                </div>
                <div>
                  <span style={{ fontSize:11, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>Candidate Name</span>
                  <div style={{ fontSize:15, fontWeight:700, color:V.textPrimary, marginTop:2 }}>{data.candidateName}</div>
                </div>
              </div>

              {/* allotments table */}
              {data.allotments?.length > 0 ? (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        <Th>Sr.</Th>
                        <Th>Round</Th>
                        <Th>College</Th>
                        <Th>Course</Th>
                        <Th>Category</Th>
                        <Th>Type</Th>
                        <Th>Admission Status</Th>
                        <Th>Allotment Date</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.allotments.map((row, i) => (
                        <tr key={i} style={{ background: i%2===0?'#fff':V.bg }}>
                          <Td center>{i+1}.</Td>
                          <Td center>{row.phase}</Td>
                          <Td>{row.collegeCode && row.college ? `${row.collegeCode} - ${row.college}` : (row.college || row.collegeCode || '—')}</Td>
                          <Td>{row.course}</Td>
                          <Td center>{row.allottedCategory}</Td>
                          <Td center>{row.allottedType}</Td>
                          <Td center>
                            <span style={{ fontSize:12, fontWeight:700, color: statusColor(row.admissionStatus) }}>
                              {row.admissionStatus || '—'}
                            </span>
                          </Td>
                          <Td center>{row.allotmentDate}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding:'40px 0', textAlign:'center' }}>
                  <i className="fas fa-list-alt" style={{ fontSize:32, color:'#e2e8f0', display:'block', marginBottom:10 }}/>
                  <p style={{ color:V.textSecond, fontSize:13, margin:0 }}>No allotment records found.</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding:'52px 0', textAlign:'center' }}>
              <i className="fas fa-list-alt" style={{ fontSize:36, color:'#e2e8f0', display:'block', marginBottom:12 }}/>
              <p style={{ color:V.textSecond, fontSize:14, margin:0 }}>No allotment data available at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
