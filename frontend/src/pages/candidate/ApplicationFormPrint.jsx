import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { applicationFormApi } from '../../services/api'

/**
 * ApplicationFormPrint — mirrors ApplicationFormPrint.aspx exactly.
 *
 * Old project: opened as a new window, body onload="PrintWindow()" auto-triggered print.
 * New project: same — opened via window.open('/candidate/print'), auto-triggers window.print() on load.
 *
 * Uses a plain table layout matching the old aspx for print compatibility.
 * No Navbar, no layout wrapper — raw print page.
 */

function resolveUrl(url) {
  if (!url) return ''
  let cur = url
  while (cur.includes('ViewFile.aspx') && cur.includes('FileURL=')) {
    const m = cur.match(/FileURL=([^&\s]+)/)
    if (!m?.[1]) break
    const x = decodeURIComponent(m[1])
    if (x === cur) break
    cur = x
  }
  return cur
}

export default function ApplicationFormPrint() {
  const { user } = useAuth()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    applicationFormApi.getSummary()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Auto-print once data loaded — mirrors body onload="PrintWindow()"
  useEffect(() => {
    if (!loading && data) {
      setTimeout(() => window.print(), 300)
    }
  }, [loading, data])

  if (loading) return (
    <div style={{ textAlign:'center', padding:40, fontFamily:'Arial,sans-serif' }}>
      <p>Preparing print preview...</p>
    </div>
  )

  if (!data?.success) return (
    <div style={{ textAlign:'center', padding:40, fontFamily:'Arial,sans-serif' }}>
      <p>Unable to load application form. Please close and try again.</p>
    </div>
  )

  const p   = data.personal      ?? {}
  const a   = data.address       ?? {}
  const cat = data.category      ?? {}
  const q   = data.qualification ?? {}
  const spt = data.sports        ?? {}
  const ps  = data.photoSign     ?? {}
  const st  = data.status        ?? {}

  const buildAddr = (l1, l2, state, dist, city, pin) =>
    [l1, l2].filter(Boolean).join(', ')
    + (state ? `, State: ${state}` : '')
    + (dist  ? `, District: ${dist}` : '')
    + (city  ? `, City/Town: ${city}` : '')
    + (pin   ? `, PIN: ${pin}` : '')

  const permAddr = buildAddr(a.addressLine1, a.addressLine2, a.state, a.district, a.city, a.pincode)
  const corrAddr = a.isCorrAddressSameAsPermanent
    ? permAddr
    : buildAddr(a.corrAddressLine1, a.corrAddressLine2, a.corrState, a.corrDistrict, a.corrCity, a.corrPincode)

  const catID        = cat.categoryID ?? 0
  const showCaste    = catID >= 2
  const showNCL      = catID > 3 && catID < 11
  const showEWS      = catID === 11
  const showCasteRcp = showCaste && cat.hasCasteCertificate === 'NO' && cat.hasReceiptCasteCertificate === 'YES'
  const showNCLRcp   = showNCL   && cat.hasNCLCertificate   === 'NO' && cat.hasNCLReceipt              === 'YES'

  const td = { border:'1px solid #000', padding:'4px 6px', fontSize:12 }
  const th = { ...td, background:'#e8e8e8', fontWeight:'bold', textAlign:'center' }
  const tdr = { ...td, textAlign:'right', width:'25%' }
  const tdv = { ...td, fontWeight:'bold' }

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 8mm; }
          body  { font-size: 11px; }
          .no-print { display: none !important; }
        }
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 8px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 0; }
        .lbl { font-weight: bold; }
      `}</style>

      {/* Print button — hidden on actual print */}
      <div className="no-print" style={{ textAlign:'right', padding:'8px', borderBottom:'1px solid #ccc', marginBottom:8 }}>
        <button onClick={() => window.print()} style={{ background:'#059669', color:'#fff', border:'none', padding:'8px 20px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer' }}>
          🖨 Print
        </button>
        <button onClick={() => window.close()} style={{ background:'#6b7280', color:'#fff', border:'none', padding:'8px 16px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', marginLeft:8 }}>
          ✕ Close
        </button>
      </div>

      <table>
        {/* ── University header ───────────────────────────────────── */}
        <tbody>
        <tr>
          <td colSpan={5} style={{ border:'1px solid #000', padding:6 }}>
            <table style={{ borderCollapse:'collapse', width:'100%' }}>
              <tbody><tr>
                <td style={{ width:'10%', textAlign:'center', border:'none' }}>
                  <img src="/MPKVLogo.png" style={{ height:65 }} alt="MPKV"/>
                </td>
                <td style={{ width:'90%', textAlign:'center', border:'none' }}>
                  <div style={{ fontSize:14, fontWeight:500 }}>महात्मा फुले कृषि विद्यापीठ, राहुरी</div>
                  <div style={{ fontSize:13, fontWeight:500 }}>Mahatma Phule Agriculture University, Rahuri</div>
                  <div style={{ fontSize:13, fontWeight:600, paddingTop:4 }}>
                    Online Agriculture Diploma / Polytechnic / Mali Certificate Admissions - 2026
                  </div>
                </td>
              </tr></tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td colSpan={5} style={{ ...td, textAlign:'center', fontSize:13 }}>
            Application ID : <span className="lbl">{p.applicationID || '—'}</span>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            Version No. : <span className="lbl">{st.versionNo || '—'}</span>
          </td>
        </tr>
        <tr>
          <td colSpan={5} style={{ ...td, textAlign:'center', fontSize:12 }}>
            <span className="lbl">{p.appliedCourse || '—'}</span>
          </td>
        </tr>

        {/* ── Personal Details ────────────────────────────────────── */}
        <tr><th colSpan={5} style={th}>Personal Details</th></tr>
        <tr>
          <td style={tdr}>Candidate's Name</td>
          <td colSpan={3} style={tdv}>{p.candidateName}</td>
          <td style={{ ...td, textAlign:'center', verticalAlign:'top' }} rowSpan={5}>
            {ps.photoUploadedURL
              ? <img src={resolveUrl(ps.photoUploadedURL)} style={{ width:80, height:102 }} alt="Photo"/>
              : <div style={{ width:80, height:102, border:'1px solid #ccc', display:'inline-block', lineHeight:'102px', textAlign:'center', fontSize:10, color:'#999' }}>Photo</div>}
          </td>
        </tr>
        <tr>
          <td style={tdr}>Father's Name</td>
          <td style={tdv}>{p.fatherName}</td>
          <td style={tdr}>Mother's Name</td>
          <td style={tdv}>{p.motherName}</td>
        </tr>
        <tr>
          <td style={tdr}>Gender</td>
          <td style={tdv}>{p.gender}</td>
          <td style={tdr}>Date of Birth</td>
          <td style={tdv}>{p.dob}</td>
        </tr>
        <tr>
          <td style={tdr}>Age (as on 01/07/2026)</td>
          <td colSpan={3} style={tdv}>{p.age}</td>
        </tr>
        <tr>
          <td style={tdr}>E-Mail ID</td>
          <td style={tdv}>{p.emailID}</td>
          <td style={tdr}>Mobile Number</td>
          <td style={tdv}>{p.mobileNo}</td>
        </tr>
        <tr>
          <td style={tdr}>Are You a Resident of India?</td>
          <td colSpan={4} style={tdv}>{p.isResidentOfIndia}</td>
        </tr>
        <tr>
          <td style={tdr}>Permanent Address</td>
          <td colSpan={4} style={tdv}>{permAddr}</td>
        </tr>
        <tr>
          <td style={tdr}>Correspondence Address</td>
          <td colSpan={4} style={tdv}>{corrAddr}</td>
        </tr>

        {/* ── Category ────────────────────────────────────────────── */}
        <tr><th colSpan={5} style={th}>Category &amp; Other Reservation Details</th></tr>
        <tr>
          <td style={tdr}>Father's Domicile District</td>
          <td style={tdv}>{cat.domicileDistrict}</td>
          <td style={tdr}>Father's Domicile Village</td>
          <td colSpan={2} style={tdv}>{cat.domicileVillage}</td>
        </tr>
        <tr>
          <td style={tdr}>Category</td>
          <td style={tdv}>{cat.category} ({cat.caste})</td>
          <td style={tdr}>Category for Admission</td>
          <td colSpan={2} style={{ ...tdv, color: cat.categoryID !== cat.finalCategoryID ? 'red' : 'inherit' }}>{cat.finalCategory}</td>
        </tr>
        {showCaste    && <tr><td colSpan={4} style={tdr}>Do You have Caste Certificate?</td><td style={tdv}>{cat.hasCasteCertificate}</td></tr>}
        {showCasteRcp && <tr><td colSpan={4} style={tdr}>Do You have Caste Certificate Receipt?</td><td style={tdv}>{cat.hasReceiptCasteCertificate}</td></tr>}
        {showNCL      && <tr><td colSpan={4} style={tdr}>Do You have Non-Creamy Layer Certificate?</td><td style={tdv}>{cat.hasNCLCertificate}</td></tr>}
        {showNCLRcp   && <tr><td colSpan={4} style={tdr}>Do You have Non-Creamy Layer Certificate Receipt?</td><td style={tdv}>{cat.hasNCLReceipt}</td></tr>}
        {showEWS      && <tr><td colSpan={4} style={tdr}>Do You have Economically Weaker Section Certificate?</td><td style={tdv}>{cat.hasEWSCertificate}</td></tr>}
        {[
          ['आपण अनाथ आहे का ?', cat.isOrphan],
          ['अपंग आहे काय ?', cat.isPWD],
          ['माजी सैनिक अथवा माजी सैनिकाचा मुलगा / मुलगी आहे काय ?', cat.isExServiceman],
          ['स्वातंत्र्य सैनिकाचा मुलगा / मुलगी आहे काय ?', cat.isFreedomFighter],
          ['प्रकल्पग्रस्त आहे का ?', cat.isProjectAffected],
          ['भूमिहीन शेतमजूराचा मुलगा / मुलगी आहे काय ?', cat.isLandlessFarmLabourer],
          ['ज्याचे उत्पन्नाचे साधन शेतीच आहे, अशा शेतकऱ्याचा / शेतमजुराचा मुलगा / मुलगी आहे का ?', cat.isIncomeSourceAgriculture],
          ['शेती धारण केली आहे काय ? (शेतकरी प्रवर्गामधील [AG Category] आरक्षणाचा लाभ)', cat.hasFarm],
          ['एन.सी.सी. / एम.सी.सी. / स्काऊट मध्ये भाग घेतला आहे काय ?', cat.isNCC],
          ['महात्मा फुले कृषि विद्यापीठ कर्मचाऱ्याचा मुलगा / मुलगी आहे काय ?', cat.isMPKVEmployee],
          ['खेळात / वादविवाद स्पर्धा / निबंध स्पर्धा / सांस्कृतिक कार्यक्रमात भाग घेतला आहे काय ?', cat.isSports],
        ].map(([q, v], i) => (
          <tr key={i}><td colSpan={4} style={tdr}>{q}</td><td style={tdv}>{v}</td></tr>
        ))}

        {/* ── Qualification ────────────────────────────────────────── */}
        <tr><th colSpan={5} style={th}>Highest Qualification Details</th></tr>
        <tr>
          <td style={tdr}>Highest Qualification</td>
          <td style={tdv}>{q.highestQualification}</td>
          <td style={tdr}>Is Any Educational Gap?</td>
          <td colSpan={2} style={tdv}>{q.isEducationalGap}</td>
        </tr>
        {q.isEducationalGap?.toUpperCase()==='YES' && (
          <tr>
            <td style={tdr}>Educational Gap (In Years)</td>
            <td style={tdv}>{q.educationalGapYears}</td>
            <td style={tdr}>Reason of Educational Gap</td>
            <td colSpan={2} style={tdv}>{q.educationalGapReason}</td>
          </tr>
        )}
        <tr><th colSpan={5} style={th}>{q.eligibilityQualification} Examination Details</th></tr>
        <tr>
          <td style={tdr}>Roll No. / Seat No.</td>
          <td style={tdv}>{q.seatNo}</td>
          <td style={tdr}>No. of Attempts</td>
          <td colSpan={2} style={tdv}>{q.noOfAttempts}</td>
        </tr>
        <tr>
          <td style={tdr}>District of Passing</td>
          <td style={tdv}>{q.passingDistrict}</td>
          <td style={tdr}>Year of Passing</td>
          <td colSpan={2} style={tdv}>{q.passingYear}</td>
        </tr>
        <tr>
          <td style={tdr}>Board</td>
          <td colSpan={4} style={tdv}>{q.board}</td>
        </tr>
        <tr>
          <td style={tdr}>Marks</td>
          <td colSpan={4} style={tdv}>{q.marksObtained} / {q.marksOutOf} ({q.percentage}%)</td>
        </tr>

        {/* ── Sports ──────────────────────────────────────────────── */}
        {spt.candidateID > 0 && <>
          <tr><th colSpan={5} style={th}>Sports Details</th></tr>
          <tr>
            <td style={tdr}>Do you have any Sports Certificate?</td>
            <td colSpan={4} style={tdv}>{spt.isSportsCertificate}</td>
          </tr>
          {spt.isSportsCertificate?.toUpperCase()==='YES' && (
            <tr>
              <td style={tdr}>Certificate Type</td>
              <td colSpan={4} style={tdv}>{spt.certificateType}</td>
            </tr>
          )}
        </>}

        {/* ── Applied Colleges ─────────────────────────────────────── */}
        {data.appliedColleges?.length > 0 && <>
          <tr><th colSpan={5} style={th}>Applied College List</th></tr>
          <tr>
            <td colSpan={5} style={td}>
              <table>
                <thead><tr style={{ background:'#e8e8e8' }}>
                  {['Preference No.','College Code','College Name','District','Status'].map(h => (
                    <th key={h} style={{ ...td, textAlign:'center' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{data.appliedColleges.map((c, i) => (
                  <tr key={i}>
                    <td style={{ ...td, textAlign:'center' }}>{c.preferenceNo}</td>
                    <td style={{ ...td, textAlign:'center' }}>{c.collegeCode}</td>
                    <td style={td}>{c.collegeName}</td>
                    <td style={{ ...td, textAlign:'center' }}>{c.district}</td>
                    <td style={{ ...td, textAlign:'center' }}>{c.courseStatus}</td>
                  </tr>
                ))}</tbody>
              </table>
            </td>
          </tr>
        </>}

        {/* ── Fee Payments ─────────────────────────────────────────── */}
        <tr><th colSpan={5} style={th}>Online Application Fee Payment List</th></tr>
        <tr>
          <td colSpan={5} style={td}>
            <table>
              <thead><tr style={{ background:'#e8e8e8' }}>
                {['Sr.','Transaction ID','Fee Amount','Transaction Date','Payment Date','Bank Ref. No.','Purpose'].map(h => (
                  <th key={h} style={{ ...td, textAlign:'center' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{(data.feePayments ?? []).map((f, i) => (
                <tr key={i}>
                  <td style={{ ...td, textAlign:'center' }}>{i+1}.</td>
                  <td style={td}>{f.transactionID}</td>
                  <td style={{ ...td, textAlign:'center' }}>₹{f.feeAmount}</td>
                  <td style={td}>{f.transactionDate}</td>
                  <td style={td}>{f.paymentDate}</td>
                  <td style={td}>{f.bankReferenceNo}</td>
                  <td style={td}>{f.purpose}</td>
                </tr>
              ))}</tbody>
            </table>
          </td>
        </tr>

        {/* ── Required Documents ───────────────────────────────────── */}
        <tr><th colSpan={5} style={th}>Required Document List</th></tr>
        <tr>
          <td colSpan={5} style={td}>
            <table>
              <thead><tr style={{ background:'#e8e8e8' }}>
                {['Sr.','Document Name','Is Uploaded'].map(h => (
                  <th key={h} style={{ ...td, textAlign:'center' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{(data.documents ?? []).map((doc, i) => (
                <tr key={i}>
                  <td style={{ ...td, textAlign:'center' }}>{i+1}.</td>
                  <td style={td}>{doc.documentName}</td>
                  <td style={{ ...td, textAlign:'center' }}>{doc.isDocumentUploaded?.toUpperCase()==='YES' || doc.documentUploadedURL?.length>0 ? 'YES' : 'NO'}</td>
                </tr>
              ))}</tbody>
            </table>
          </td>
        </tr>

        {/* ── Declaration ──────────────────────────────────────────── */}
        <tr><th colSpan={5} style={{ ...th, textAlign:'center' }}>Declaration / Undertaking by the Candidate</th></tr>
        <tr>
          <td colSpan={5} style={td}>
            <p style={{ textAlign:'justify', margin:'4px 0', fontSize:11 }}>
              I hereby declare that all the information given by me in this application is true and correct to the best
              of my knowledge and belief and nothing has been concealed. I also undertake that if any of the above
              statements or information are found to be incorrect or false or any information or particulars have been
              suppressed or omitted therefrom, I am liable to be disqualified and my candidature/admission may be
              cancelled without any notice. I have read and understood the contents of the Information Brochure.
              I acknowledge that filling of this form does not guarantee admission.
            </p>
          </td>
        </tr>
        <tr>
          <td colSpan={2} style={td}>Date : <span className="lbl">{st.lastModifiedOn || '—'}</span></td>
          <td colSpan={2} rowSpan={3} style={{ ...td, textAlign:'center', verticalAlign:'bottom' }}>
            {ps.signUploadedURL
              ? <img src={resolveUrl(ps.signUploadedURL)} style={{ width:130, height:42 }} alt="Signature"/>
              : <div style={{ width:130, height:42, border:'1px solid #ccc', display:'inline-block', lineHeight:'42px', textAlign:'center', fontSize:10, color:'#999' }}>Signature</div>}
            <br/>Signature of the Candidate<br/>
            <span className="lbl">({p.candidateName || '—'})</span>
          </td>
          <td style={td}></td>
        </tr>
        <tr>
          <td colSpan={2} style={td}>Locked On : <span className="lbl">{st.lastModifiedOn || '—'}</span></td>
          <td style={td}></td>
        </tr>
        <tr>
          <td colSpan={2} style={td}>Locked By : <span className="lbl">{p.candidateName || '—'}</span></td>
          <td style={td}></td>
        </tr>
        </tbody>
      </table>
    </>
  )
}
