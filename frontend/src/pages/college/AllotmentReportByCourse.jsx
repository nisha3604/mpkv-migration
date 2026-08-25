import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { reportApi } from '../../services/api'

/**
 * Allotment Report By Course
 * Professional design — navy/slate/white palette, Excel export
 * Backend unchanged: SP Report_GetAllotmentReportByCourse(@CollegeID, @PhaseID)
 */
export default function AllotmentReportByCourse() {
  const { isAdmin }  = useAuth()
  const navigate     = useNavigate()
  const [searchParams] = useSearchParams()
  const qsCollegeId  = searchParams.get('CollegeID') || searchParams.get('collegeId')
  const tableRef     = useRef(null)

  const [phases,    setPhases]    = useState([])
  const [phaseId,   setPhaseId]   = useState('-1')
  const [phaseName, setPhaseName] = useState('')
  const [report,    setReport]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [reporting, setReporting] = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    reportApi.getPhases()
      .then(res => {
        if (res.data.success && res.data.phases?.length > 0) {
          setPhases(res.data.phases)
          const cur    = res.data.currentPhaseID?.toString()
          const exists = res.data.phases.find(p => p.value === cur)
          const sel    = exists ? cur : res.data.phases[0]?.value ?? '-1'
          setPhaseId(sel)
          setPhaseName(res.data.phases.find(p => p.value === sel)?.text ?? '')
        }
      })
      .catch(() => setError('Failed to load rounds.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (phaseId !== '-1' && parseInt(phaseId) > 0) loadReport(parseInt(phaseId))
  }, [phaseId])

  const loadReport = async (pid) => {
    setReporting(true); setError(''); setReport(null)
    try {
      const res = await reportApi.getAllotmentByCourse(pid, qsCollegeId || undefined)
      if (res.data.success) setReport(res.data)
      else setError(res.data.message || 'Failed to load report.')
    } catch { setError('An error occurred.') }
    finally { setReporting(false) }
  }

  // Excel export — proper XLS with metadata
  const handleExport = () => {
    if (!tableRef.current) return
    const printedOn = new Date().toLocaleString('en-IN')
    const metaRows  = `
      <tr><td colspan="8" style="font-weight:bold;font-size:14pt;background:#14212e;color:white;">Allotment Report — ${phaseName}</td></tr>
      ${report?.collegeName ? `<tr><td colspan="8">${report.collegeName}</td></tr>` : ''}
      <tr><td colspan="8" style="font-style:italic;color:gray;">Printed On: ${printedOn}</td></tr>
      <tr><td colspan="8"></td></tr>
    `
    const html = `
      <html><head><meta charset='utf-8'/>
      <style>
        table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:11pt;}
        th,td{border:1px solid #dee2e6;padding:6px 10px;}
        th{background:#14212e;color:white;font-weight:bold;}
        .footer{background:#D5CEA3;font-weight:bold;}
      </style>
      </head><body>
      <table>${metaRows}${tableRef.current.innerHTML}</table>
      </body></html>`
    const blob = new Blob([html], { type:'application/vnd.ms-excel;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `AllotmentReport_${phaseName.replace(/\s+/g,'_')}.xls`; a.click()
    URL.revokeObjectURL(url)
  }

  const now = new Date()
  const printedOn = now.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' })
                  + '  ' + now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })

  // Professional colour scheme — navy header, slate accents, one accent green
  const C = { navy:'#14212e', navyLight:'#1e3a5f', slate:'#475569', slateLight:'#64748b', border:'#e2e8f0', bg:'#f8fafc', accent:'#059669', white:'#fff', footerBg:'#f1f5f9', rowHover:'#f8fafc' }

  const thBase = { padding:'11px 14px', color:C.white, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap', borderRight:`1px solid rgba(255,255,255,.1)` }

  const tdBase = { padding:'10px 14px', fontSize:13, borderBottom:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}` }

  // Clickable number — only when > 0, else plain text
  const NumCell = ({ row, flag, value }) => {
    const val = value ?? 0
    return (
      <td style={{ ...tdBase, textAlign:'center' }}>
        {val > 0
          ? <button onClick={() => navigate(`/college/reports/allotment-detail?phaseId=${row.phaseID}&collegeId=${row.collegeID}&flag=${flag}`)}
              style={{ background:'transparent', border:'none', color:C.accent, fontWeight:700, fontSize:13, cursor:'pointer', textDecoration:'underline', padding:0, fontFamily:'inherit' }}>
              {val}
            </button>
          : <span style={{ color:'#cbd5e1', fontWeight:500 }}>0</span>
        }
      </td>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  return (
    <div style={{ background:'#f1f5f9', minHeight:'100vh', padding:'20px 20px 32px', fontFamily:'inherit' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>

        {/* Error */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:10, padding:'10px 16px', marginBottom:14, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {/* ── Header card ──────────────────────────────────────────────── */}
        <div style={{ background:C.white, borderRadius:16, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,.06)', marginBottom:16 }}>

          {/* Title strip */}
          <div style={{ background:C.navy, padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="fas fa-chart-bar" style={{ color:C.white, fontSize:15 }} />
              </div>
              <div>
                <h2 style={{ color:C.white, fontWeight:800, fontSize:16, margin:0, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>Allotment Report</h2>
                {phaseName && <p style={{ color:'rgba(255,255,255,.6)', fontSize:12, margin:'2px 0 0' }}>{phaseName}</p>}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              {/* Phase dropdown */}
              <div style={{ position:'relative' }}>
                <i className="fas fa-filter" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.5)', fontSize:11, pointerEvents:'none' }} />
                <select value={phaseId} onChange={e => { setPhaseId(e.target.value); setPhaseName(phases.find(p=>p.value===e.target.value)?.text??'') }}
                  style={{ paddingLeft:30, paddingRight:24, paddingTop:8, paddingBottom:8, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.25)', borderRadius:8, fontSize:13, color:C.white, fontFamily:'inherit', outline:'none', cursor:'pointer', appearance:'none', fontWeight:600, minWidth:180 }}>
                  <option value="-1" style={{ color:'#0f172a', background:C.white }}>Select Round</option>
                  {phases.map(p => <option key={p.value} value={p.value} style={{ color:'#0f172a', background:C.white }}>{p.text}</option>)}
                </select>
                <i className="fas fa-chevron-down" style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.5)', fontSize:9, pointerEvents:'none' }} />
              </div>

              {/* Export Excel button */}
              {report && (
                <button onClick={handleExport}
                  style={{ display:'flex', alignItems:'center', gap:7, background:'#217346', color:C.white, border:'none', borderRadius:8, padding:'8px 16px', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(33,115,70,.4)', transition:'all .18s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#1a5c38'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#217346'; e.currentTarget.style.transform='translateY(0)' }}>
                  <i className="fas fa-file-excel" style={{ fontSize:13 }} /> Export to Excel
                </button>
              )}

              {/* Back — admin only */}
              {isAdmin && (
                <button onClick={() => navigate('/college/reports/allotment-by-college')}
                  style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.85)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, padding:'8px 14px', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .18s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.15)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.08)'}>
                  <i className="fas fa-arrow-left" style={{ fontSize:10 }} /> Back
                </button>
              )}
            </div>
          </div>

          {/* Report info strip */}
          {report && (
            <div style={{ background:C.bg, padding:'10px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {report.collegeName && (
                  <><i className="fas fa-university" style={{ color:C.slateLight, fontSize:11 }} />
                  <span style={{ fontSize:12.5, color:C.slate, fontWeight:600 }}>{report.collegeName}</span></>
                )}
              </div>
              <span style={{ fontSize:11.5, color:C.slateLight, fontStyle:'italic' }}>Printed On : {printedOn}</span>
            </div>
          )}

          {/* ── Table ──────────────────────────────────────────────────── */}
          {reporting ? (
            <div style={{ padding:40, textAlign:'center' }}>
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p style={{ color:C.slateLight, fontSize:13 }}>Loading report data...</p>
            </div>
          ) : report ? (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead ref={tableRef}>
                  <tr style={{ background:C.navy }}>
                    <th style={{ ...thBase, width:'5%', textAlign:'center' }}>Sr.</th>
                    <th style={{ ...thBase, textAlign:'left', width:'40%' }}>Course Name</th>
                    <th style={{ ...thBase, textAlign:'center' }}>Allotment</th>
                    <th style={{ ...thBase, textAlign:'center' }}>Allotment<br/>Refused</th>
                    <th style={{ ...thBase, textAlign:'center' }}>Letter<br/>Downloaded</th>
                    <th style={{ ...thBase, textAlign:'center' }}>Admitted</th>
                    <th style={{ ...thBase, textAlign:'center' }}>Rejected</th>
                    <th style={{ ...thBase, textAlign:'center', borderRight:'none' }}>Cancelled</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows?.length === 0
                    ? <tr><td colSpan={8} style={{ padding:28, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No data for this round.</td></tr>
                    : report.rows?.map((row, i) => (
                        <tr key={i}
                          style={{ transition:'background .15s' }}
                          onMouseEnter={e => e.currentTarget.style.background=C.rowHover}
                          onMouseLeave={e => e.currentTarget.style.background=i%2===0?C.white:C.bg}>
                          <td style={{ ...tdBase, textAlign:'center', color:C.slateLight, background:i%2===0?C.white:C.bg }}>{i+1}.</td>
                          <td style={{ ...tdBase, fontWeight:600, color:'#0f172a', background:i%2===0?C.white:C.bg }}>{row.courseName}</td>
                          <NumCell row={row} flag="Allotment"                 value={row.allotment}                 />
                          <NumCell row={row} flag="AllotmentRefused"          value={row.allotmentRefused}          />
                          <NumCell row={row} flag="AllotmentLetterDownloaded" value={row.allotmentLetterDownloaded} />
                          <NumCell row={row} flag="Admitted"                  value={row.admitted}                  />
                          <NumCell row={row} flag="Rejected"                  value={row.rejected}                  />
                          <NumCell row={row} flag="Cancelled"                 value={row.cancelled}                 />
                        </tr>
                      ))
                  }
                </tbody>
                {report.rows?.length > 0 && (
                  <tfoot>
                    <tr style={{ background:'#D5CEA3' }}>
                      <td style={{ ...tdBase, textAlign:'center', background:'#D5CEA3' }} />
                      <td style={{ ...tdBase, textAlign:'right', fontWeight:800, color:'#0f172a', background:'#D5CEA3' }}>Total</td>
                      {[report.totalAllotment, report.totalAllotmentRefused, report.totalAllotmentLetterDownloaded, report.totalAdmitted, report.totalRejected, report.totalCancelled].map((v,i) => (
                        <td key={i} style={{ ...tdBase, textAlign:'center', fontWeight:800, fontSize:14, color:v>0?C.navy:C.slateLight, background:'#D5CEA3' }}>{v}</td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : (
            <div style={{ padding:'40px 0', textAlign:'center' }}>
              <i className="fas fa-chart-bar" style={{ fontSize:32, color:'#e2e8f0', marginBottom:10, display:'block' }} />
              <p style={{ color:C.slateLight, fontSize:13, margin:0 }}>Select a round above to load the report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
