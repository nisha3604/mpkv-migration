import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { reportApi } from '../../services/api'

/**
 * AllotmentDetail — mirrors AllotmentReport.aspx exactly.
 *
 * URL: /college/reports/allotment-detail?phaseId=1&collegeId=1001&flag=Allotment
 * SP : Report_GetAllotmentReport(@CollegeID, @PhaseID, @Flag)
 *
 * Columns: Sr. | Merit No. | Total Weightage | Application ID | Candidate Name | Mobile No | Allotted Type | Current Status
 *
 * Flags: Allotment | AllotmentRefused | AllotmentLetterDownloaded | Admitted | Rejected | Cancelled
 */
export default function AllotmentDetail() {
  const [sp]       = useSearchParams()
  const navigate   = useNavigate()
  const tableRef   = useRef(null)

  const phaseId  = parseInt(sp.get('phaseId')  || '0')
  const collegeId = sp.get('collegeId')  || undefined
  const flag      = sp.get('flag')       || 'Allotment'

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!phaseId) { setError('Invalid parameters.'); setLoading(false); return }
    reportApi.getAllotmentDetail(phaseId, collegeId, flag)
      .then(r => {
        if (r.data.success) setData(r.data)
        else setError(r.data.message || 'Failed to load.')
      })
      .catch(() => setError('An error occurred.'))
      .finally(() => setLoading(false))
  }, [phaseId, collegeId, flag])

  const handleExport = () => {
    if (!tableRef.current || !data) return
    const now = new Date().toLocaleString('en-IN')
    const flagLabel = data.flagLabel ? ` — ${data.flagLabel}` : ''
    const html = `<html><head><meta charset='utf-8'/>
      <style>
        table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:11pt;width:100%;}
        th,td{border:1px solid #dee2e6;padding:6px 10px;}
        th{background:#14212e;color:#fff;font-weight:bold;}
        .footer{background:#D5CEA3;font-weight:bold;}
      </style></head><body>
      <p style="font-weight:bold;font-size:14pt;">Allotment Report${flagLabel}</p>
      ${data.collegeName ? `<p style="font-weight:600;">${data.collegeName}</p>` : ''}
      ${data.courseName  ? `<p>${data.courseName}</p>` : ''}
      <p style="color:gray;font-style:italic;">Printed On: ${now}</p>
      <table>${tableRef.current.innerHTML}</table>
      </body></html>`
    const blob = new Blob([html], { type:'application/vnd.ms-excel;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `AllotmentDetail_${flag}.xls`; a.click()
    URL.revokeObjectURL(url)
  }

  const C = {
    navy:'#14212e', border:'#e2e8f0', bg:'#f8fafc',
    accent:'#059669', white:'#fff', muted:'#64748b',
  }
  const thS = { padding:'10px 13px', color:C.white, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap', borderRight:'1px solid rgba(255,255,255,.1)' }
  const tdS = { padding:'9px 13px', fontSize:13, borderBottom:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}` }

  const statusColor = (s) => {
    if (!s) return C.muted
    const l = s.toLowerCase()
    if (l.includes('admitted'))  return '#059669'
    if (l.includes('rejected'))  return '#dc2626'
    if (l.includes('cancelled')) return '#f59e0b'
    if (l.includes('refused'))   return '#7c3aed'
    if (l.includes('not'))       return C.muted
    return '#0ea5e9'
  }

  const flagLabel = data?.flagLabel || ''
  const now = new Date()
  const printedOn = now.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' })
    + '  ' + now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })

  const backUrl = `/college/reports/allotment?${collegeId ? `collegeId=${collegeId}&` : ''}phaseId=${phaseId}`

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div style={{ background:C.bg, minHeight:'100vh', padding:'20px 20px 32px', fontFamily:'inherit' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:14, fontSize:13 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{error}
          </div>
        )}

        <div style={{ background:C.white, borderRadius:16, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>

          {/* Header */}
          <div style={{ background:C.navy, padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <h2 style={{ color:C.white, fontWeight:800, fontSize:16, margin:0 }}>
                Allotment Report{flagLabel ? ` — ${flagLabel}` : ''}
              </h2>
              {data?.collegeName && <p style={{ color:'rgba(255,255,255,.6)', fontSize:12, margin:'3px 0 0' }}>{data.collegeName}</p>}
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {data?.rows?.length > 0 && (
                <button onClick={handleExport}
                  style={{ display:'flex', alignItems:'center', gap:6, background:'#217346', color:C.white, border:'none', borderRadius:8, padding:'8px 16px', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  <i className="fas fa-file-excel"/>Export to Excel
                </button>
              )}
              <button onClick={() => navigate(-1)}
                style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.85)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, padding:'8px 14px', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <i className="fas fa-arrow-left" style={{ fontSize:10 }}/>Back
              </button>
            </div>
          </div>

          {/* Meta strip */}
          {data && (
            <div style={{ background:C.bg, padding:'9px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 }}>
              <div style={{ fontSize:12.5, color:'#475569', fontWeight:600 }}>
                {data.courseName && <span><i className="fas fa-graduation-cap" style={{ marginRight:5, color:C.muted }}/>{data.courseName}</span>}
              </div>
              <span style={{ fontSize:11.5, color:C.muted, fontStyle:'italic' }}>Printed On : {printedOn}</span>
            </div>
          )}

          {/* Table */}
          {!data || data.rows?.length === 0 ? (
            <div style={{ padding:'40px 0', textAlign:'center' }}>
              <i className="fas fa-users" style={{ fontSize:32, color:'#e2e8f0', marginBottom:10, display:'block' }}/>
              <p style={{ color:C.muted, fontSize:13 }}>No candidates found for this selection.</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table ref={tableRef} style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:C.navy }}>
                    <th style={{ ...thS, width:'4%',  textAlign:'center' }}>Sr.</th>
                    <th style={{ ...thS, width:'6%',  textAlign:'center' }}>Merit No.</th>
                    <th style={{ ...thS, width:'7%',  textAlign:'center' }}>Weightage</th>
                    <th style={{ ...thS, width:'12%', textAlign:'center' }}>Application ID</th>
                    <th style={{ ...thS, width:'25%', textAlign:'left'   }}>Candidate Name</th>
                    <th style={{ ...thS, width:'12%', textAlign:'center' }}>Mobile No.</th>
                    <th style={{ ...thS, width:'12%', textAlign:'center' }}>Allotted Type</th>
                    <th style={{ ...thS, width:'14%', textAlign:'center', borderRight:'none' }}>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr key={i}
                      style={{ background: i%2===0?C.white:C.bg, transition:'background .15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f0fdf9'}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?C.white:C.bg}>
                      <td style={{ ...tdS, textAlign:'center', color:C.muted }}>{i+1}.</td>
                      <td style={{ ...tdS, textAlign:'center', fontWeight:600 }}>{row.meritNo || '—'}</td>
                      <td style={{ ...tdS, textAlign:'center', fontWeight:600 }}>{row.totalWeightage || '—'}</td>
                      <td style={{ ...tdS, textAlign:'center', fontWeight:700, color:C.accent }}>{row.applicationID}</td>
                      <td style={{ ...tdS, fontWeight:600, color:'#0f172a' }}>{row.candidateName}</td>
                      <td style={{ ...tdS, textAlign:'center' }}>{row.mobileNo || '—'}</td>
                      <td style={{ ...tdS, textAlign:'center', fontSize:12 }}>{row.allottedTypeDisplay || '—'}</td>
                      <td style={{ ...tdS, textAlign:'center', borderRight:'none' }}>
                        <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:12, fontSize:11.5, fontWeight:700,
                          background: statusColor(row.currentStatus) + '18',
                          color: statusColor(row.currentStatus) }}>
                          {row.currentStatus || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background:'#D5CEA3' }}>
                    <td colSpan={7} style={{ ...tdS, textAlign:'right', fontWeight:800, color:'#0f172a', background:'#D5CEA3' }}>
                      Total Candidates
                    </td>
                    <td style={{ ...tdS, textAlign:'center', fontWeight:800, fontSize:14, color:'#0f172a', background:'#D5CEA3', borderRight:'none' }}>
                      {data.rows.length}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
