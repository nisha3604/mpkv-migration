/**
 * Shared building-blocks used by AdmissionLetter, AdmissionCancellationLetter,
 * AdmissionRejectionLetter — mirrors the identical sections in the old project's
 * three ASPX pages.
 */

export function resolveUrl(url) {
  if (!url) return ''
  let cur = url
  for (let i = 0; i < 5; i++) {
    if (!cur.includes('ViewFile.aspx')) break
    const m = cur.match(/FileURL=([^&\s]+)/); if (!m) break
    const x = decodeURIComponent(m[1]); if (x === cur) break; cur = x
  }
  return cur
}

export const ACADEMIC_YEAR = '2025-26'

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )
}

// ── Error box ─────────────────────────────────────────────────────────────────
export function ErrBox({ msg }) {
  return (
    <div style={{ maxWidth:700, margin:'40px auto', padding:'0 20px' }}>
      <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'14px 18px', fontSize:14 }}>
        <i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{msg}
      </div>
    </div>
  )
}

// ── Top toolbar (screen only, hidden when printing) ───────────────────────────
export function ToolBar({ title, backUrl, navigate, onPrint, btnLabel, btnColor = '#059669' }) {
  return (
    <div className="no-print" style={{ background:'#f1f5f9', borderBottom:'1px solid #e2e8f0', padding:'12px 20px', display:'flex', alignItems:'center', gap:10 }}>
      <button onClick={() => navigate(backUrl)}
        style={{ background:'#6b7280', color:'#fff', border:'none', padding:'9px 20px', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
        ← Back
      </button>
      <span style={{ fontWeight:700, fontSize:15, color:'#0f172a', marginLeft:4 }}>{title}</span>
      <button onClick={onPrint}
        style={{ marginLeft:'auto', background:btnColor, color:'#fff', border:'none', padding:'9px 20px', borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
        <i className="fas fa-print"/>{btnLabel}
      </button>
    </div>
  )
}

// ── University header (visible in print) ─────────────────────────────────────
export function UnivHeader() {
  return (
    <div style={{ textAlign:'center', marginBottom:12 }}>
      <img src="/images/logo.png" alt="MPKV" style={{ height:55, marginBottom:6 }}
        onError={e=>e.currentTarget.style.display='none'}/>
      <div style={{ fontSize:16, fontWeight:700 }}>Mahatma Phule Agriculture University</div>
      <div style={{ fontSize:12, color:'#6c757d' }}>Rahuri, Ahilyanagar, Maharashtra</div>
      <hr style={{ borderColor:'#dee2e6', margin:'8px 0' }}/>
    </div>
  )
}

// ── Card section wrapper ──────────────────────────────────────────────────────
export function CardSection({ header, children }) {
  return (
    <div className="ltr-card">
      <div className="ltr-card-header">{header}</div>
      <div className="ltr-card-body">{children}</div>
    </div>
  )
}

// ── Personal Details (2-col grid + photo + signature) ─────────────────────────
export function PersonalDetails({ d }) {
  const pairs = [
    ['Application ID',  d.applicationID],
    ['Roll No.',        d.rollNo        || '—'],
    ["Candidate's Name",d.candidateName],
    ['',                ''],
    ["Father's Name",   d.fatherName],
    ["Mother's Name",   d.motherName],
    ['Gender',          d.gender],
    ['Date of Birth',   d.dob],
    ['E-Mail ID',       d.eMailID],
    ['Mobile Number',   d.mobileNo],
    ['Category',        d.category],
    ['EWS',             d.isEWS        || '—'],
    ['PTG',             d.isPTG        || '—'],
    ['PTG Type',        d.pTGType      || '—'],
    ['SMQ',             d.isSMQ        || '—'],
    ['SMQ Priority Code',d.sMQPriorityCode||'—'],
    ['Divyang',         d.isPWD        || '—'],
    ['Divyang Type',    d.disabilityType||'—'],
    ['MCQ',             d.isMCQ        || '—'],
    ['TFW',             d.isTFWS       || '—'],
  ]

  return (
    <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
      {/* 2-column grid of label-value pairs */}
      <div style={{ flex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
          {pairs.map(([label, value], i) => (
            label ? (
              <div key={i} className="ltr-field">
                <span className="ltr-label">{label} :</span>
                <span className="ltr-value">{value}</span>
              </div>
            ) : <div key={i}/>
          ))}
        </div>
      </div>
      {/* Photo + Signature */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0 }}>
        <img src={resolveUrl(d.photoURL)} alt="Photo"
          style={{ width:97, height:125, objectFit:'contain', border:'1px solid #dee2e6' }}
          onError={e=>e.currentTarget.src='/dummy-user.png'}/>
        <img src={resolveUrl(d.signURL)} alt="Signature"
          style={{ width:97, height:42, objectFit:'contain', border:'1px solid #dee2e6', marginTop:4 }}
          onError={e=>e.currentTarget.src='/dummy-user.png'}/>
      </div>
    </div>
  )
}

// ── Merit Ranks table ─────────────────────────────────────────────────────────
export function MeritRanks({ d }) {
  const cols = ['CML Rank','Category Rank','EWS Rank','PTG Rank','MCQ Rank','SMQ Rank','Divyang Rank','TFW Rank']
  const vals = [
    d.cMLMeritNo    || '—',
    d.categoryMeritNo||'—',
    d.eWSMeritNo    || '—',
    d.pTGMeritNo    || '—',
    d.mCQMeritNo    || '—',
    d.sMQMeritNo    || '—',
    d.pWDMeritNo    || '—',
    d.tFWSMeritNo   || '—',
  ]
  return (
    <div style={{ marginTop:12, overflowX:'auto' }}>
      <table className="ltr-table">
        <thead>
          <tr>{cols.map(c=><th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          <tr>{vals.map((v,i)=><td key={i}>{v}</td>)}</tr>
        </tbody>
      </table>
    </div>
  )
}

// ── AdmissionInfo — fixed layout with proper wrapping ───────────────────────
export function AdmissionInfo({ d, remarkLabel, remarkValue }) {
  const rows = [
    ['Name of the Institute',                                d.allottedCollege],
    ['Name of the Branch',                                   d.allottedCourse],
    ['Category through which Allotted',                      d.allottedCategory],
    ['Name of the Admission/Nodal Officer',                  d.nodalOfficerName    || '—'],
    ['Mobile/Contact No. of the Admission/Nodal Officer',    d.nodalOfficerMobileNo|| '—'],
    ['E-Mail ID & Website of the Institute',                 [d.nodalOfficerEMailID, d.collegeWebsite].filter(Boolean).join(', ') || '—'],
  ]
  return (
    <>
      {rows.map(([label, value], i) => (
        <div key={i} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'flex-start' }}>
          <span style={{ fontWeight:600, color:'#495057', flexShrink:0, width:280, fontSize:13 }}>{label} :</span>
          <span style={{ color:'#212529', fontWeight:500, fontSize:13, flex:1 }}>{value}</span>
        </div>
      ))}
      {remarkValue && (
        <div style={{ display:'flex', gap:8, marginBottom:6, alignItems:'flex-start', color:'#dc2626' }}>
          <span style={{ fontWeight:600, flexShrink:0, width:280, fontSize:13, color:'#dc2626' }}>{remarkLabel} :</span>
          <span style={{ fontWeight:500, fontSize:13, flex:1 }}>{remarkValue}</span>
        </div>
      )}
    </>
  )
}

// ── Two-column footer row ─────────────────────────────────────────────────────
export function FooterRow2({ col1Label, col1Value, col2Label, col2Value }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12 }}>
      <div className="ltr-field">
        <span className="ltr-label">{col1Label} :</span>
        <span className="ltr-value">{col1Value || '—'}</span>
      </div>
      <div className="ltr-field">
        <span className="ltr-label">{col2Label} :</span>
        <span className="ltr-value">{col2Value || '—'}</span>
      </div>
    </div>
  )
}

// ── Global styles injected once ───────────────────────────────────────────────
export function LetterStyles() {
  return (
    <style>{`
      .letter-wrap {
        max-width: 960px;
        margin: 20px auto;
        padding: 20px;
        background: #fff;
        font-family: Arial, sans-serif;
        font-size: 13px;
        color: #212529;
      }
      .ltr-card {
        border: 1px solid #dee2e6;
        border-radius: 4px;
        margin-top: 12px;
        overflow: hidden;
      }
      .ltr-card-header {
        background: #e9ecef;
        padding: 8px 14px;
        font-weight: 700;
        font-size: 13px;
        border-bottom: 1px solid #dee2e6;
      }
      .ltr-card-body {
        padding: 14px 16px;
      }
      .ltr-field {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin-bottom: 5px;
      }
      .ltr-field-full {
        flex-wrap: nowrap;
      }
      .ltr-label {
        font-weight: 600;
        color: #495057;
        white-space: nowrap;
        flex-shrink: 0;
        min-width: 160px;
      }
      .ltr-value {
        color: #212529;
        font-weight: 500;
      }
      .ltr-intro {
        margin: 0 0 6px;
      }
      .ltr-ol {
        list-style-type: decimal;
        padding-left: 28px;
        margin: 0 0 10px;
      }
      .ltr-ol li {
        text-align: justify;
        margin-bottom: 4px;
        line-height: 1.55;
      }
      .ltr-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        text-align: center;
      }
      .ltr-table th, .ltr-table td {
        border: 1px solid #dee2e6;
        padding: 6px 8px;
      }
      .ltr-table th {
        background: #e9ecef;
        font-weight: 700;
      }
      .no-print { display: block; }

      @media print {
        /* Hide the entire page layout — only show letter-page-root */
        html, body { margin: 0; padding: 0; }

        /* Hide everything that is NOT inside letter-page-root */
        body *:not(.letter-page-root):not(.letter-page-root *) {
          visibility: hidden !important;
        }

        /* Show everything inside letter-page-root */
        .letter-page-root, .letter-page-root * {
          visibility: visible !important;
        }

        /* Position the letter-page-root at top-left */
        .letter-page-root {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
        }

        /* Hide toolbar inside the letter page */
        .no-print {
          display: none !important;
          visibility: hidden !important;
        }

        .letter-wrap {
          margin: 0 !important;
          padding: 10px !important;
          max-width: 100% !important;
          box-shadow: none !important;
        }

        /* Never break inside a card — keep each section whole */
        .ltr-card {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
    `}</style>
  )
}
