import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { reportApi } from '../../services/api'

/**
 * Composite Admission Report By Course
 * Professional design — navy/slate/white palette, Excel export
 * Phase columns shown ONLY up to MaxActivePhaseID from SP (Tables[0])
 * Backend unchanged: Report_GetCompositeAdmissionReportByCourse(@CollegeID)
 */
export default function CompositeAdmissionReportByCourse() {
  const { isAdmin }    = useAuth()
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const qsCollegeId    = searchParams.get('CollegeID') || searchParams.get('collegeId')
  const tableRef       = useRef(null)

  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Phase labels — exact match from old project (gvCompositeReport header row)
  const phaseLabels = {
    1:'Round-I',
    2:'Round-II',
    3:'Round-III',
    4:'Round-III (A)',
    5:'Special Admission Process (Round-I)',
    6:'Special Admission Process (Round-II)',
    7:'Special Admission Process (Round-III)',
    8:'Special Admission Process (Round-III (A))',
    9:'Round-IX',
    10:'Round-X',
  }

  useEffect(() => {
    reportApi.getCompositeByCourse(qsCollegeId || undefined)
      .then(res => {
        if (res.data.success) setReport(res.data)
        else setError(res.data.message || 'Failed to load report.')
      })
      .catch(err => setError(err.response?.data?.message ?? 'An error occurred.'))
      .finally(() => setLoading(false))
  }, [qsCollegeId])

  // Excel export with proper formatting
  const handleExport = () => {
    if (!tableRef.current) return
    const now       = new Date()
    const printedOn = now.toLocaleString('en-IN')
    const html = `
      <html><head><meta charset='utf-8'/>
      <style>
        table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:10pt;}
        th,td{border:1px solid #ccc;padding:5px 8px;}
        .h1{background:#14212e;color:white;font-weight:bold;font-size:13pt;}
        .h2{background:#1e3a5f;color:white;font-weight:bold;}
        .footer{background:#D5CEA3;font-weight:bold;}
        .subh{background:#f8fafc;font-weight:bold;color:#14212e;}
      </style></head><body>
      <table>
        <tr><td colspan="50" class="h1">Composite Admission Report</td></tr>
        ${report?.collegeName ? `<tr><td colspan="50" class="h2">${report.collegeName}</td></tr>` : ''}
        <tr><td colspan="50" style="font-style:italic;color:gray;font-size:9pt;">Printed On: ${printedOn}</td></tr>
        <tr><td colspan="50"></td></tr>
        ${tableRef.current.innerHTML}
      </table></body></html>`
    const blob = new Blob([html], { type:'application/vnd.ms-excel;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `CompositeAdmissionReport${report?.collegeName ? '_' + report.collegeName.replace(/\s+/g,'_') : ''}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  const now       = new Date()
  const printedOn = now.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' })
                  + '  ' + now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })

  // MaxActivePhaseID comes from SP Tables[0] — ONLY show that many columns
  const maxPhase = report?.maxActivePhaseID ?? 0

  const C = {
    navy:'#14212e', navyLight:'#1e3a5f',
    slate:'#475569', slateLight:'#64748b',
    border:'#e2e8f0', bg:'#f8fafc',
    accent:'#059669', white:'#fff',
    footerBg:'#D5CEA3',
  }

  const thBase = { padding:'10px 12px', color:C.white, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.04em', textAlign:'center', borderRight:`1px solid rgba(255,255,255,.1)`, whiteSpace:'nowrap' }
  const tdBase = { padding:'10px 12px', fontSize:13, borderBottom:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}`, textAlign:'center' }

  // Clickable phase cell
  const PhaseCell = ({ value, collegeId, phaseId }) => {
    const val = value ?? 0
    return (
      <td style={tdBase}>
        {val > 0
          ? <button onClick={() => navigate(`/college/reports/composite-detail?phaseId=${phaseId}&collegeId=${collegeId}`)}
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
      <div style={{ maxWidth:1400, margin:'0 auto' }}>

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
                <i className="fas fa-table" style={{ color:C.white, fontSize:15 }} />
              </div>
              <div>
                <h2 style={{ color:C.white, fontWeight:800, fontSize:16, margin:0, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>Composite Admission Report</h2>
                {report?.collegeName && <p style={{ color:'rgba(255,255,255,.6)', fontSize:12, margin:'2px 0 0' }}>{report.collegeName}</p>}
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {/* Export Excel */}
              {report?.rows?.length > 0 && (
                <button onClick={handleExport}
                  style={{ display:'flex', alignItems:'center', gap:7, background:'#217346', color:C.white, border:'none', borderRadius:8, padding:'8px 16px', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(33,115,70,.4)', transition:'all .18s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#1a5c38'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#217346'; e.currentTarget.style.transform='translateY(0)' }}>
                  <i className="fas fa-file-excel" style={{ fontSize:13 }} /> Export to Excel
                </button>
              )}

              {/* Back — admin only */}
              {isAdmin && (
                <button onClick={() => navigate('/college/reports/composite-by-college')}
                  style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.85)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, padding:'8px 14px', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .18s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.15)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.08)'}>
                  <i className="fas fa-arrow-left" style={{ fontSize:10 }} /> Back
                </button>
              )}
            </div>
          </div>

          {/* Meta info strip */}
          {report && (
            <div style={{ background:C.bg, padding:'10px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              {report.collegeName
                ? <span style={{ fontSize:12.5, color:C.slate, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                    <i className="fas fa-university" style={{ color:C.slateLight, fontSize:11 }} />{report.collegeName}
                  </span>
                : <span />
              }
              <span style={{ fontSize:11.5, color:C.slateLight, fontStyle:'italic' }}>Printed On : {printedOn}</span>
            </div>
          )}

          {/* ── Table ──────────────────────────────────────────────────── */}
          {report?.rows?.length === 0 ? (
            <div style={{ padding:'40px 0', textAlign:'center' }}>
              <i className="fas fa-table" style={{ fontSize:32, color:'#e2e8f0', marginBottom:10, display:'block' }} />
              <p style={{ color:C.slateLight, fontSize:13, margin:0 }}>No data available.</p>
            </div>
          ) : report ? (
            <div style={{ overflowX:'auto' }}>
              <table ref={tableRef} style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  {/* Row 1 — group headers */}
                  <tr style={{ background:C.navy }}>
                    <th rowSpan={2} style={{ ...thBase, width:'4%' }}>Sr.</th>
                    <th rowSpan={2} style={{ ...thBase, textAlign:'left', width:'30%' }}>Course Name</th>
                    <th rowSpan={2} style={thBase}>Intake</th>
                    {/* Admitted group header spanning all phase cols + total */}
                    <th colSpan={maxPhase + 1} style={{ ...thBase, background:C.navyLight, borderBottom:`2px solid rgba(255,255,255,.2)` }}>
                      Admitted
                    </th>
                    <th rowSpan={2} style={{ ...thBase, borderRight:'none' }}>Vacancy</th>
                  </tr>
                  {/* Row 2 — individual phase + total sub-headers */}
                  <tr style={{ background:C.navyLight }}>
                    {Array.from({ length: maxPhase }, (_, i) => i + 1).map(p => (
                      <th key={p} style={{ ...thBase, fontSize:10, fontWeight:600, color:'rgba(255,255,255,.85)', borderTop:`1px solid rgba(255,255,255,.1)`, whiteSpace:'normal', maxWidth:90, lineHeight:1.3 }}>
                        {phaseLabels[p] ?? `Round-${p}`}
                      </th>
                    ))}
                    {/* Total sub-header */}
                    <th style={{ ...thBase, fontSize:11, fontWeight:800, color:C.white, background:'rgba(5,150,105,.3)', borderTop:`1px solid rgba(255,255,255,.1)` }}>
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {report.rows.map((row, i) => (
                    <tr key={i}
                      style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0?C.white:C.bg, transition:'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#f0fdf9'}
                      onMouseLeave={e => e.currentTarget.style.background=i%2===0?C.white:C.bg}>
                      <td style={{ ...tdBase, color:C.slateLight, fontSize:12, fontWeight:600 }}>{i+1}.</td>
                      <td style={{ ...tdBase, textAlign:'left', fontWeight:700, color:'#0f172a' }}>{row.courseName}</td>
                      <td style={{ ...tdBase, fontWeight:700, color:'#0f172a' }}>{row.intake}</td>
                      {maxPhase >= 1  && <PhaseCell value={row.admittedPhase1}  collegeId={row.collegeID} phaseId={1}  />}
                      {maxPhase >= 2  && <PhaseCell value={row.admittedPhase2}  collegeId={row.collegeID} phaseId={2}  />}
                      {maxPhase >= 3  && <PhaseCell value={row.admittedPhase3}  collegeId={row.collegeID} phaseId={3}  />}
                      {maxPhase >= 4  && <PhaseCell value={row.admittedPhase4}  collegeId={row.collegeID} phaseId={4}  />}
                      {maxPhase >= 5  && <PhaseCell value={row.admittedPhase5}  collegeId={row.collegeID} phaseId={5}  />}
                      {maxPhase >= 6  && <PhaseCell value={row.admittedPhase6}  collegeId={row.collegeID} phaseId={6}  />}
                      {maxPhase >= 7  && <PhaseCell value={row.admittedPhase7}  collegeId={row.collegeID} phaseId={7}  />}
                      {maxPhase >= 8  && <PhaseCell value={row.admittedPhase8}  collegeId={row.collegeID} phaseId={8}  />}
                      {maxPhase >= 9  && <PhaseCell value={row.admittedPhase9}  collegeId={row.collegeID} phaseId={9}  />}
                      {maxPhase >= 10 && <PhaseCell value={row.admittedPhase10} collegeId={row.collegeID} phaseId={10} />}
                      {/* Total */}
                      <PhaseCell value={row.totalAdmitted} collegeId={row.collegeID} phaseId={0} />
                      {/* Vacancy */}
                      <td style={{ ...tdBase, fontWeight:700, color:row.vacancy>0?'#dc2626':C.slateLight, borderRight:'none' }}>{row.vacancy}</td>
                    </tr>
                  ))}
                </tbody>

                {/* Footer totals */}
                <tfoot>
                  <tr style={{ background:C.footerBg }}>
                    <td style={{ ...tdBase, background:C.footerBg }} />
                    <td style={{ ...tdBase, textAlign:'right', fontWeight:800, color:'#0f172a', background:C.footerBg }}>Total</td>
                    <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalIntake}</td>
                    {maxPhase >= 1  && <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalAdmittedPhase1}</td>}
                    {maxPhase >= 2  && <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalAdmittedPhase2}</td>}
                    {maxPhase >= 3  && <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalAdmittedPhase3}</td>}
                    {maxPhase >= 4  && <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalAdmittedPhase4}</td>}
                    {maxPhase >= 5  && <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalAdmittedPhase5}</td>}
                    {maxPhase >= 6  && <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalAdmittedPhase6}</td>}
                    {maxPhase >= 7  && <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalAdmittedPhase7}</td>}
                    {maxPhase >= 8  && <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalAdmittedPhase8}</td>}
                    {maxPhase >= 9  && <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalAdmittedPhase9}</td>}
                    {maxPhase >= 10 && <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalAdmittedPhase10}</td>}
                    <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg }}>{report.totalTotalAdmitted}</td>
                    <td style={{ ...tdBase, fontWeight:800, color:'#0f172a', background:C.footerBg, borderRight:'none' }}>{report.totalVacancy}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
