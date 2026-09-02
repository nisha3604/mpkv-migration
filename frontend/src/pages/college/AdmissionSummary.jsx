import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { admissionApi } from '../../services/api'

/**
 * AdmissionSummary — mirrors ConfirmAdmission.aspx exactly.
 *
 * URL params: p1=CandidateID, p2=EncryptedID, c1=CollegeID, r1=PhaseID, flag=ConfirmAdmission|CancelAdmission
 *
 * Exact old-project behaviour replicated:
 *  - View doc opens full-screen modal: left panel = candidate info + Accept/Reject buttons,
 *    right panel = iframe with document. Accept → sets verify=Y, Reject → requires comment then sets verify=N.
 *  - Upload opens a modal popup with DocumentNo + IssueDate fields
 *    (hidden for docIDs 1,2,4,14,15,19), PDF only, 1024KB max.
 *  - Verify dropdown is DISABLED — only the Accept/Reject buttons in view modal change it.
 *  - Confirm validates all docs are Y (not N-without-comment).
 *  - Reject shows confirm popup then calls rejectAdmission with mandatory remarks.
 *  - After success: redirects to /college/admission/confirm (not navigate(-1)).
 *
 * Tables affected by SPs:
 *  ConfirmAdmission → ApplicationForm_DocumentDetails, ApplicationForm_DocumentDetails_History,
 *                     College_AllotmentDetails (ReportingStatus='Y'), College_AllotmentDetails_History
 *  RejectAdmission  → same, ReportingStatus='R'
 *  CancelAdmission  → College_AllotmentDetails (ReportingStatus='C'), history
 */

// DocumentIDs that do NOT need DocumentNo + IssueDate on upload
const NO_DOC_INFO_IDS = [1, 2, 4, 14, 15, 19]

function resolveDocUrl(url) {
  if (!url) return ''
  let cur = url
  for (let i = 0; i < 5; i++) {
    if (cur.includes('ViewFile.aspx') && cur.includes('FileURL=')) {
      const m = cur.match(/FileURL=([^&\s]+)/); if (!m?.[1]) break
      const x = decodeURIComponent(m[1]); if (x === cur) break; cur = x
    } else break
  }
  return cur
}

export default function AdmissionSummary() {
  const navigate       = useNavigate()
  const [sp]           = useSearchParams()
  const { user }       = useAuth()

  const candidateId  = parseInt(sp.get('p1') || '0')
  const collegeId    = parseInt(sp.get('c1') || '0')
  const phaseId      = parseInt(sp.get('r1') || '0')
  const flag         = sp.get('flag') || 'ConfirmAdmission'
  const isConfirm    = flag === 'ConfirmAdmission'
  const isCancel     = flag === 'CancelAdmission'

  // ── Page state ──────────────────────────────────────────────────────────────
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [pageErr,     setPageErr]     = useState('')
  const [pageOk,      setPageOk]      = useState('')

  // docs: [{...spFields, verifyStatus:'Y'|'N'|'', comment:''}]
  const [docs,        setDocs]        = useState([])
  const [remarks,     setRemarks]     = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  // ── View-doc modal ───────────────────────────────────────────────────────────
  const [viewModal,   setViewModal]   = useState(null) // { doc, modalComment }
  const [viewComment, setViewComment] = useState('')

  // ── Upload modal ─────────────────────────────────────────────────────────────
  const [uploadModal, setUploadModal] = useState(null) // doc object
  const [uploadDocNo,    setUploadDocNo]    = useState('')
  const [uploadIssueDate,setUploadIssueDate]= useState('')
  const [uploadFile,  setUploadFile]  = useState(null)
  const [uploading,   setUploading]   = useState(false)
  const [uploadErr,   setUploadErr]   = useState('')
  const uploadFileRef = useRef()

  // ── Reject-confirm modal ─────────────────────────────────────────────────────
  const [showRejectModal, setShowRejectModal] = useState(false)

  // ── Success-alert modal (mirrors ucAlertBox) ─────────────────────────────────
  const [alertMsg, setAlertMsg] = useState('')  // non-empty = show alert

  const V = {
    navy:'#14212e', primary:'#059669', primaryDark:'#047857',
    red:'#dc2626', redDark:'#b91c1c',
    border:'#e2e8f0', light:'#f8fafc',
    text:'#0f172a', muted:'#64748b',
    bg:'#f1f5f9',
  }

  // ── Load summary ─────────────────────────────────────────────────────────────
  const loadSummary = () => {
    if (!candidateId || !collegeId || !phaseId) {
      setPageErr('Invalid URL parameters.'); setLoading(false); return
    }
    setLoading(true)
    admissionApi.getAdmissionSummary({ candidateID: candidateId, collegeID: collegeId, phaseID: phaseId, flag })
      .then(res => {
        if (!res.data.success) { setPageErr(res.data.message || 'Failed to load.'); return }
        setData(res.data)
        setDocs((res.data.documents ?? []).map(doc => ({
          ...doc,
          // verifyStatus: mirrors gvRequiredDocuments_RowDataBound
          // If no URL → force N + "Document not uploaded." comment
          verifyStatus: doc.documentUploadedURL?.length > 0
            ? (doc.documentVerificationStatus === 'Verified' ? 'Y' : 'N')
            : 'N',
          comment: doc.documentUploadedURL?.length > 0
            ? (doc.documentVerificationComments || '')
            : 'Document not uploaded.',
          isUploaded: (doc.isDocumentUploaded === 'YES' || doc.documentUploadedURL?.length > 0),
        })))
      })
      .catch(err => setPageErr(err.response?.data?.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }
  useEffect(loadSummary, [candidateId, collegeId, phaseId, flag])

  // ── View doc ──────────────────────────────────────────────────────────────────
  const openViewModal = (doc) => {
    setViewModal(doc)
    setViewComment(doc.comment || '')
  }
  const handleViewAccept = () => {
    // Accept → verify = Y, save comment back to row
    setDocs(prev => prev.map(d => d.documentID === viewModal.documentID
      ? { ...d, verifyStatus: 'Y', comment: viewComment } : d))
    setViewModal(null)
  }
  const handleViewReject = () => {
    if (!viewComment.trim()) { alert('Please Enter Comments.'); return }
    setDocs(prev => prev.map(d => d.documentID === viewModal.documentID
      ? { ...d, verifyStatus: 'N', comment: viewComment } : d))
    setViewModal(null)
  }

  // ── Upload doc ────────────────────────────────────────────────────────────────
  const openUploadModal = (doc) => {
    setUploadModal(doc)
    setUploadDocNo(''); setUploadIssueDate(''); setUploadFile(null); setUploadErr('')
  }
  const handleUploadSubmit = async () => {
    if (!uploadFile) { setUploadErr('Please Select Document to Upload.'); return }
    const needDocInfo = !NO_DOC_INFO_IDS.includes(uploadModal.documentID)
    if (needDocInfo && (!uploadDocNo.trim() || !uploadIssueDate.trim())) {
      setUploadErr('Please Enter Certificate No. and Issue Date.'); return
    }
    // Size check: 1024 KB
    if (uploadFile.size > 1024 * 1024) { setUploadErr('Maximum File Size Allowed is 1024 KB.'); return }
    // Type check: PDF only
    const ext = uploadFile.name.split('.').pop().toLowerCase()
    if (ext !== 'pdf') { setUploadErr('Only pdf Files are Allowed.'); return }

    setUploading(true); setUploadErr('')
    try {
      const fd = new FormData()
      fd.append('file',            uploadFile)
      fd.append('candidateID',     candidateId)
      fd.append('collegeID',       collegeId)
      fd.append('phaseID',         phaseId)
      fd.append('documentID',      uploadModal.documentID)
      if (needDocInfo) {
        fd.append('documentNo',    uploadDocNo.trim().toUpperCase())
        fd.append('documentIssueDate', uploadIssueDate.trim())
      }
      const res = await admissionApi.uploadAdmissionDocument(fd)
      if (res.data.success) {
        setUploadModal(null)
        loadSummary()  // reload like old project's GetAdmissionSummary() after upload
      } else setUploadErr(res.data.message || 'Upload failed.')
    } catch (err) { setUploadErr(err.response?.data?.message ?? 'Upload failed.') }
    finally { setUploading(false) }
  }

  // ── Validate before confirm/reject — mirrors ValidateDocumentVerification() ──
  const validateDocs = () => {
    const errors = []
    docs.forEach(d => {
      if (d.verifyStatus === 'N' && !d.comment.trim())
        errors.push(`Please Enter Comments for Not Verifying ${d.documentName}`)
      else if (!d.verifyStatus)
        errors.push(`Please Verify ${d.documentName}`)
    })
    return errors
  }

  const buildPayload = () => ({
    candidateID: candidateId, collegeID: collegeId, phaseID: phaseId, comments: remarks,
    documents: docs.map(d => ({ documentID: d.documentID, verificationStatus: d.verifyStatus, verificationComments: d.comment })),
  })

  // ── Confirm ───────────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    const errors = validateDocs()
    if (errors.length) { setPageErr(errors.join('\n')); return }
    const allVerified = docs.every(d => d.verifyStatus === 'Y')
    if (!allVerified) { setPageErr('Please Verify All Documents.'); return }
    setSubmitting(true); setPageErr(''); setPageOk('')
    try {
      const res = await admissionApi.confirmAdmission(buildPayload())
      if (res.data.success) setAlertMsg('Admission Confirmed Successfully.')
      else setPageErr(res.data.message || 'Failed to confirm admission.')
    } catch (err) { setPageErr(err.response?.data?.message ?? 'Failed.') }
    finally { setSubmitting(false) }
  }

  // ── Reject ────────────────────────────────────────────────────────────────────
  const handleRejectClick = () => {
    const errors = validateDocs()
    if (errors.length) { setPageErr(errors.join('\n')); return }
    setShowRejectModal(true)
  }
  const handleRejectConfirm = async () => {
    setShowRejectModal(false)
    if (!remarks.trim()) { setPageErr('Please Enter Reason for Rejection under Remark.'); return }
    setSubmitting(true); setPageErr(''); setPageOk('')
    try {
      const res = await admissionApi.rejectAdmission(buildPayload())
      if (res.data.success) setAlertMsg('Admission Rejected Successfully.')
      else setPageErr(res.data.message || 'Failed.')
    } catch (err) { setPageErr(err.response?.data?.message ?? 'Failed.') }
    finally { setSubmitting(false) }
  }

  // ── Cancel ────────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!remarks.trim()) { setPageErr('Please Enter Reason for Cancellation.'); return }
    setSubmitting(true); setPageErr(''); setPageOk('')
    try {
      const res = await admissionApi.cancelAdmission(buildPayload())
      if (res.data.success) setAlertMsg('Admission Cancelled Successfully.')
      else setPageErr(res.data.message || 'Failed.')
    } catch (err) { setPageErr(err.response?.data?.message ?? 'Failed.') }
    finally { setSubmitting(false) }
  }

  // ── After alert OK — redirect to confirm search page (mirrors CloseAlertBox) ──
  const handleAlertOk = () => {
    setAlertMsg('')
    navigate('/college/admission/confirm')
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const Row = ({ label, value }) => (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', borderTop:`1px solid ${V.border}` }}>
      <div style={{ padding:'8px 14px', fontSize:13, color:V.muted, fontWeight:500, background:V.light, borderRight:`1px solid ${V.border}` }}>{label}</div>
      <div style={{ padding:'8px 14px', fontSize:13, color:V.text, fontWeight:600 }}>{value || '—'}</div>
    </div>
  )
  const SectionHeader = ({ title, icon }) => (
    <div style={{ padding:'10px 20px', background:'#f0fdf4', borderTop:`1px solid ${V.border}`, borderBottom:`1px solid #bbf7d0`, display:'flex', alignItems:'center', gap:8 }}>
      {icon && <i className={icon} style={{ color:V.primary, fontSize:13 }}/>}
      <span style={{ fontSize:12, fontWeight:700, color:V.primary, textTransform:'uppercase', letterSpacing:'.07em' }}>{title}</span>
    </div>
  )

  const flagLabel = { ConfirmAdmission:'Confirm Admission', CancelAdmission:'Cancel Admission' }[flag] ?? flag
  const flagColor = isCancel ? V.red : V.primary
  const flagGrad  = isCancel
    ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
    : 'linear-gradient(135deg,#059669,#047857)'

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div style={{ background:V.bg, minHeight:'100vh', padding:'20px 20px 48px', fontFamily:'inherit' }}>
      <div style={{ maxWidth:1060, margin:'0 auto' }}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div style={{ background:flagGrad, borderRadius:14, padding:'16px 24px', marginBottom:20, display:'flex', alignItems:'center', gap:14, boxShadow:`0 8px 24px ${flagColor}30` }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className={isCancel?'fas fa-user-times':'fas fa-user-check'} style={{ color:'#fff', fontSize:20 }}/>
          </div>
          <div>
            <p style={{ color:'rgba(255,255,255,.7)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', margin:'0 0 2px' }}>Admission Menu</p>
            <h2 style={{ color:'#fff', fontWeight:800, fontSize:18, margin:0 }}>{flagLabel}</h2>
          </div>
          <button onClick={() => navigate('/college/admission/confirm')}
            style={{ marginLeft:'auto', background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.3)', padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            ← Back
          </button>
        </div>

        {/* ── Messages ────────────────────────────────────────────────────── */}
        {pageErr && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.red, borderRadius:8, padding:'10px 16px', marginBottom:14, fontSize:13, whiteSpace:'pre-line' }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{pageErr}
          </div>
        )}
        {pageOk && (
          <div style={{ background:'#f0fdf4', border:'1px solid #86efac', color:'#166534', borderRadius:8, padding:'10px 16px', marginBottom:14, fontSize:13 }}>
            <i className="fas fa-check-circle" style={{ marginRight:6 }}/>{pageOk}
          </div>
        )}

        {!data && !loading && (
          <div style={{ background:'#fff', borderRadius:12, padding:32, textAlign:'center', color:V.muted }}>No data found.</div>
        )}

        {data && (
          <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

            {/* ── Card header ─────────────────────────────────────────── */}
            <div style={{ background:V.navy, padding:'13px 20px' }}>
              <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>
                <i className="fas fa-user" style={{ marginRight:8 }}/>Candidate Details
              </span>
            </div>

            {/* ── Personal details + photo/sign ───────────────────────── */}
            <div style={{ padding:'20px' }}>
              <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
                    <Row label="Application ID"          value={data.applicationID}/>
                    <Row label="Applied Course"          value={data.appliedCourse}/>
                    <Row label="Candidate's Name"        value={data.candidateName}/>
                    <Row label="Gender"                  value={data.gender}/>
                    <Row label="Date of Birth"           value={data.dob}/>
                    <Row label="Father's Domicile Dist." value={data.domicileDistrict}/>
                    <Row label="Category"                value={data.category}/>
                    <Row label="Father's Name"           value={data.fatherName}/>
                    <Row label="Mother's Name"           value={data.motherName}/>
                    <Row label="Eligibility Qual."       value={data.eligibilityQualification}/>
                    <Row label="Marks"                   value={data.eligibilityQualificationMarks}/>
                    <Row label="Mobile No."              value={data.mobileNo}/>
                    <Row label="E-Mail ID"               value={data.eMailID}/>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0, paddingTop:4 }}>
                  <img src={resolveDocUrl(data.photoURL)} alt="Photo"
                    style={{ width:97, height:124, objectFit:'contain', border:`2px solid ${V.border}`, borderRadius:6 }}
                    onError={e=>{ e.currentTarget.src='/dummy-user.png' }}/>
                  <span style={{ fontSize:10, fontWeight:700, color:V.muted, textTransform:'uppercase' }}>Photograph</span>
                  <img src={resolveDocUrl(data.signURL)} alt="Signature"
                    style={{ width:120, height:42, objectFit:'contain', border:`2px solid ${V.border}`, borderRadius:6, marginTop:4 }}
                    onError={e=>{ e.currentTarget.src='/dummy-user.png' }}/>
                  <span style={{ fontSize:10, fontWeight:700, color:V.muted, textTransform:'uppercase' }}>Signature</span>
                </div>
              </div>
            </div>

            {/* ── Weightage table ─────────────────────────────────────── */}
            <SectionHeader title="Weightage Details" icon="fas fa-weight-hanging"/>
            <div style={{ padding:'16px 20px' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:V.navy }}>
                      <th style={{ padding:'9px 12px', color:'#fff', fontWeight:700, width:'8%', textAlign:'center', whiteSpace:'nowrap' }}>Sr.</th>
                      <th style={{ padding:'9px 12px', color:'#fff', fontWeight:700, textAlign:'left' }}>Description</th>
                      <th style={{ padding:'9px 12px', color:'#fff', fontWeight:700, width:'12%', textAlign:'center', whiteSpace:'nowrap' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['1.','Academic Marks Standard',                    data.academicWeightage],
                      ['2.','7/12 of agricultural land (Talathi / Patwari)',data.weightage712],
                      ['3.','NCC / MCC / Scout Guide Certificate (Class 8–10)', data.nCCWeightage],
                      ['4.','Participation in Taluka / District Level Sports (Class 8–10)', data.sportWeightage],
                      ['5.','Son/Daughter of Current/Ex. Employee of State Agricultural University', data.mPKVEmployeeWeightage],
                    ].map(([sr, desc, pts], i) => (
                      <tr key={i} style={{ background:i%2===0?'#fff':'#f8fafc', borderBottom:`1px solid ${V.border}` }}>
                        <td style={{ padding:'8px 12px', textAlign:'center', color:V.muted }}>{sr}</td>
                        <td style={{ padding:'8px 12px', color:V.text }}>{desc}</td>
                        <td style={{ padding:'8px 12px', textAlign:'center', fontWeight:700, color:V.text }}>{pts || '0'}</td>
                      </tr>
                    ))}
                    <tr style={{ background:'#f0fdf4', borderTop:`2px solid #bbf7d0` }}>
                      <td colSpan={2} style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, color:V.primary }}>Total Points</td>
                      <td style={{ padding:'8px 12px', textAlign:'center', fontWeight:800, fontSize:15, color:V.primary }}>{data.totalWeightage || '0'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Current Seat Allotment Status ────────────────────────── */}
            <SectionHeader title={`Current Seat Allotment Status (${data.allotmentPhase || ''})`} icon="fas fa-university"/>
            <div style={{ padding:'16px 20px' }}>
              <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
                <Row label="Name of the School"              value={`${data.allottedCollegeCode ? data.allottedCollegeCode+' - ' : ''}${data.allottedCollege}`}/>
                <Row label="Name of the Course"              value={data.allottedCourse}/>
                <Row label="Allotted Category / Special Cat." value={data.allottedCategory}/>
                <Row label="Allotted Gender Quota"           value={data.allottedType}/>
              </div>
            </div>

            {/* ── Required Documents ──────────────────────────────────── */}
            <SectionHeader title="List of Documents to be Verified" icon="fas fa-folder-open"/>
            <div style={{ padding:'16px 20px' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:V.navy }}>
                      {['Sr.','Document Name','Upload','View','Verification Status','Comments'].map((h,i) => (
                        <th key={i} style={{ padding:'10px 12px', color:'#fff', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', textAlign: i===1?'left':'center', whiteSpace:'nowrap',
                          width: i===0?'5%':i===1?'38%':i===2?'8%':i===3?'6%':i===4?'14%':'29%' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc, i) => (
                      <tr key={doc.documentID}
                        style={{ borderBottom:`1px solid ${V.border}`, background:i%2===0?'#fff':'#fafbfc', verticalAlign:'middle' }}>

                        {/* Sr */}
                        <td style={{ padding:'10px 12px', textAlign:'center', color:V.muted, fontSize:12 }}>{i+1}.</td>

                        {/* Document Name — red * for compulsory */}
                        <td style={{ padding:'10px 12px', fontWeight:600, color:V.text }}>
                          {doc.isDocumentCompulsory === 'YES' && <span style={{ color:V.red, marginRight:2 }}>*</span>}
                          {doc.documentName}
                        </td>

                        {/* Upload button */}
                        <td style={{ padding:'10px 12px', textAlign:'center' }}>
                          <button onClick={() => openUploadModal(doc)}
                            title="Upload Document"
                            style={{ background:'transparent', border:'none', cursor:'pointer', padding:4 }}>
                            <img src="/images/ic_file_upload_black_48dp_2x.png" alt="Upload"
                              style={{ width:24, height:24 }}
                              onError={e=>{ e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='inline' }}/>
                            <i className="fas fa-upload" style={{ display:'none', color:V.primary, fontSize:16 }}/>
                          </button>
                        </td>

                        {/* View button — only when uploaded */}
                        <td style={{ padding:'10px 12px', textAlign:'center' }}>
                          {doc.isUploaded && doc.documentUploadedURL ? (
                            <button onClick={() => openViewModal(doc)}
                              title="View Document"
                              style={{ background:'transparent', border:'none', cursor:'pointer', padding:4 }}>
                              <img src="/App_Themes/default/images/ico-search.png" alt="View"
                                style={{ width:25, height:25 }}
                                onError={e=>{ e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='inline' }}/>
                              <i className="fas fa-search" style={{ display:'none', color:V.primary, fontSize:16 }}/>
                            </button>
                          ) : <span style={{ color:'#d1d5db', fontSize:12 }}>—</span>}
                        </td>

                        {/* Verification Status — DISABLED, set only by view modal */}
                        <td style={{ padding:'10px 12px', textAlign:'center' }}>
                          <select value={doc.verifyStatus} disabled
                            style={{ padding:'5px 8px', border:`1px solid ${V.border}`, borderRadius:6, fontSize:12, background:'#f8fafc', cursor:'not-allowed', color: doc.verifyStatus==='Y'?'#166534': doc.verifyStatus==='N'?V.red:V.muted, fontWeight:600 }}>
                            <option value="">Select</option>
                            <option value="Y">Verified</option>
                            <option value="N">Not Verified</option>
                          </select>
                        </td>

                        {/* Comments — read-only, set by view modal */}
                        <td style={{ padding:'10px 12px', minWidth:160 }}>
                          <input type="text" value={doc.comment} readOnly
                            style={{ width:'100%', padding:'5px 8px', border:`1px solid ${V.border}`, borderRadius:6, fontSize:12, background:'#f8fafc', color:V.text, boxSizing:'border-box' }}/>
                        </td>
                      </tr>
                    ))}
                    {docs.length === 0 && (
                      <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:V.muted }}>No documents found.</td></tr>
                    )}
                  </tbody>
                </table>
                <p style={{ fontSize:11, color:V.muted, marginTop:8 }}>
                  <span style={{ color:V.red }}>*</span> Compulsory Documents
                </p>
              </div>
            </div>

            {/* ── Remarks ─────────────────────────────────────────────── */}
            <SectionHeader title="Remark" icon="fas fa-comment-alt"/>
            <div style={{ padding:'16px 20px' }}>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
                maxLength={250}
                placeholder={isCancel ? 'Enter reason for cancellation...' : 'Enter remarks...'}
                style={{ width:'100%', padding:'10px 12px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit', resize:'vertical', outline:'none', boxSizing:'border-box', color:V.text }}
                onFocus={e=>e.target.style.borderColor=flagColor}
                onBlur={e=>e.target.style.borderColor=V.border}/>
            </div>

            {/* ── Action buttons ───────────────────────────────────────── */}
            <div style={{ display:'flex', justifyContent:'center', gap:14, padding:'16px 20px 24px', borderTop:`1px solid ${V.border}` }}>
              {isConfirm && <>
                <button onClick={handleConfirm} disabled={submitting}
                  style={{ background:submitting?'#d1fae5':V.primary, color:'#fff', border:'none', padding:'11px 32px', borderRadius:8, fontSize:14, fontWeight:700, cursor:submitting?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(5,150,105,.3)' }}
                  onMouseEnter={e=>{ if(!submitting) e.currentTarget.style.background=V.primaryDark }}
                  onMouseLeave={e=>{ if(!submitting) e.currentTarget.style.background=V.primary }}>
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                    : <><i className="fas fa-check"/>Confirm Admission</>}
                </button>
                <button onClick={handleRejectClick} disabled={submitting}
                  style={{ background:V.red, color:'#fff', border:'none', padding:'11px 32px', borderRadius:8, fontSize:14, fontWeight:700, cursor:submitting?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(220,38,38,.3)' }}
                  onMouseEnter={e=>{ if(!submitting) e.currentTarget.style.background=V.redDark }}
                  onMouseLeave={e=>{ if(!submitting) e.currentTarget.style.background=V.red }}>
                  <i className="fas fa-times"/>Reject Admission
                </button>
              </>}
              {isCancel && (
                <button onClick={handleCancel} disabled={submitting}
                  style={{ background:V.red, color:'#fff', border:'none', padding:'11px 32px', borderRadius:8, fontSize:14, fontWeight:700, cursor:submitting?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(220,38,38,.3)' }}>
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                    : <><i className="fas fa-ban"/>Cancel Admission</>}
                </button>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          VIEW DOCUMENT MODAL — mirrors old project's modalDocument + ViewDoc()
          Left: candidate info + Accept / Reject buttons
          Right: iframe with document
         ════════════════════════════════════════════════════════════════════ */}
      {viewModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:9000, display:'flex', flexDirection:'column' }}>
          {/* Modal header */}
          <div style={{ background:V.navy, padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <h6 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:15 }}>{viewModal.documentName}</h6>
            <button onClick={() => setViewModal(null)}
              style={{ background:'#dc2626', color:'#fff', border:'none', padding:'4px 12px', borderRadius:5, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              ✕
            </button>
          </div>
          {/* Modal body */}
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            {/* Left panel: candidate info + accept/reject */}
            <div style={{ width:320, flexShrink:0, background:'#fff', borderRight:`1px solid ${V.border}`, overflowY:'auto', padding:'16px' }}>
              {data && (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, marginBottom:16 }}>
                  <tbody>
                    <tr><td colSpan={2} style={{ textAlign:'center', padding:'8px', fontWeight:700, background:'#f8fafc', borderBottom:`1px solid ${V.border}` }}>{data.appliedCourse}</td></tr>
                    {[
                      ['Candidate Name', data.candidateName],
                      ['Father Name',    data.fatherName],
                      ['Mother Name',    data.motherName],
                      ['Gender',         data.gender],
                      ['DOB',            data.dob],
                      ['Category',       data.category],
                      ['Domicile Dist.', data.domicileDistrict],
                      [`${data.eligibilityQualification} Marks`, data.eligibilityQualificationMarks],
                    ].map(([label, value], i) => (
                      <tr key={i} style={{ borderBottom:`1px solid ${V.border}` }}>
                        <td style={{ padding:'6px 8px', fontWeight:600, color:V.muted, width:'45%', background:'#f8fafc' }}>{label}</td>
                        <td style={{ padding:'6px 8px', color:V.text }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {/* Comment field */}
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:700, color:V.muted, display:'block', marginBottom:4 }}>Comments</label>
                <textarea value={viewComment} onChange={e => setViewComment(e.target.value)} rows={3} maxLength={250}
                  style={{ width:'100%', padding:'7px 10px', border:`1.5px solid ${V.border}`, borderRadius:6, fontSize:12, fontFamily:'inherit', resize:'vertical', outline:'none', boxSizing:'border-box' }}
                  onFocus={e=>e.target.style.borderColor=V.primary}
                  onBlur={e=>e.target.style.borderColor=V.border}/>
              </div>
              {/* Accept / Reject */}
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                <button onClick={handleViewAccept}
                  style={{ flex:1, background:V.primary, color:'#fff', border:'none', padding:'9px 0', borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
                  onMouseEnter={e=>e.currentTarget.style.background=V.primaryDark}
                  onMouseLeave={e=>e.currentTarget.style.background=V.primary}>
                  Accept
                </button>
                <button onClick={handleViewReject}
                  style={{ flex:1, background:V.red, color:'#fff', border:'none', padding:'9px 0', borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
                  onMouseEnter={e=>e.currentTarget.style.background=V.redDark}
                  onMouseLeave={e=>e.currentTarget.style.background=V.red}>
                  Reject
                </button>
              </div>
            </div>
            {/* Right panel: iframe */}
            <div style={{ flex:1, overflow:'hidden' }}>
              <iframe
                src={resolveDocUrl(viewModal.documentUploadedURL)}
                title={viewModal.documentName}
                style={{ width:'100%', height:'100%', border:'none' }}/>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          UPLOAD DOCUMENT MODAL — mirrors modalDocumentUpload
         ════════════════════════════════════════════════════════════════════ */}
      {uploadModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:520, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            {/* header */}
            <div style={{ background:V.navy, padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:'#fff', fontWeight:700, fontSize:14 }}>Upload — {uploadModal.documentName}</span>
              <button onClick={() => setUploadModal(null)}
                style={{ background:'#dc2626', color:'#fff', border:'none', padding:'3px 10px', borderRadius:5, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
            </div>
            {/* body */}
            <div style={{ padding:'20px' }}>
              {/* File type + size info */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14, fontSize:13 }}>
                <div style={{ background:'#f8fafc', border:`1px solid ${V.border}`, borderRadius:6, padding:'8px 12px' }}>
                  <span style={{ color:V.muted, fontWeight:500 }}>File Types Allowed: </span>
                  <span style={{ fontWeight:700, color:V.text }}>pdf</span>
                </div>
                <div style={{ background:'#f8fafc', border:`1px solid ${V.border}`, borderRadius:6, padding:'8px 12px' }}>
                  <span style={{ color:V.muted, fontWeight:500 }}>Max Size: </span>
                  <span style={{ fontWeight:700, color:V.text }}>1 MB</span>
                </div>
              </div>

              {/* DocumentNo + IssueDate — hidden for docIDs 1,2,4,14,15,19 */}
              {!NO_DOC_INFO_IDS.includes(uploadModal.documentID) && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:V.muted, display:'block', marginBottom:5 }}>
                      Certificate No. <span style={{ color:V.red }}>*</span>
                    </label>
                    <input value={uploadDocNo} onChange={e => setUploadDocNo(e.target.value.toUpperCase())}
                      maxLength={50}
                      style={{ width:'100%', padding:'8px 10px', border:`1.5px solid ${V.border}`, borderRadius:7, fontSize:13, fontFamily:'inherit', boxSizing:'border-box', textTransform:'uppercase' }}
                      onFocus={e=>e.target.style.borderColor=V.primary}
                      onBlur={e=>e.target.style.borderColor=V.border}/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:V.muted, display:'block', marginBottom:5 }}>
                      Issue Date (DD/MM/YYYY) <span style={{ color:V.red }}>*</span>
                    </label>
                    <input value={uploadIssueDate} onChange={e => setUploadIssueDate(e.target.value)}
                      maxLength={10} placeholder="DD/MM/YYYY"
                      style={{ width:'100%', padding:'8px 10px', border:`1.5px solid ${V.border}`, borderRadius:7, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }}
                      onFocus={e=>e.target.style.borderColor=V.primary}
                      onBlur={e=>e.target.style.borderColor=V.border}/>
                  </div>
                </div>
              )}

              {/* File input */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:V.muted, display:'block', marginBottom:5 }}>
                  Select File to Upload <span style={{ color:V.red }}>*</span>
                </label>
                <input type="file" ref={uploadFileRef} accept=".pdf"
                  onChange={e => { setUploadFile(e.target.files?.[0] || null); setUploadErr('') }}
                  style={{ width:'100%', padding:'7px 10px', border:`1.5px solid ${V.border}`, borderRadius:7, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }}/>
              </div>

              {uploadErr && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.red, borderRadius:6, padding:'8px 12px', fontSize:12.5, marginBottom:10 }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight:5 }}/>{uploadErr}
                </div>
              )}
            </div>
            {/* footer */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'12px 20px', borderTop:`1px solid ${V.border}`, background:'#f8fafc' }}>
              <button onClick={() => setUploadModal(null)}
                style={{ background:'#6b7280', color:'#fff', border:'none', padding:'9px 22px', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Close
              </button>
              <button onClick={handleUploadSubmit} disabled={uploading}
                style={{ background:uploading?'#d1fae5':V.primary, color:'#fff', border:'none', padding:'9px 22px', borderRadius:7, fontSize:13, fontWeight:700, cursor:uploading?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                {uploading ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Uploading...</> : <><i className="fas fa-upload"/>Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          REJECT CONFIRM POPUP — mirrors ucConfirmBox / mpeConfirmBox
         ════════════════════════════════════════════════════════════════════ */}
      {showRejectModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:12, maxWidth:420, width:'100%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ background:V.navy, padding:'13px 20px' }}>
              <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Reject Admission</span>
            </div>
            <div style={{ padding:'28px 24px', textAlign:'center' }}>
              <i className="fas fa-exclamation-triangle" style={{ color:'#f59e0b', fontSize:32, display:'block', marginBottom:12 }}/>
              <p style={{ fontSize:14.5, color:V.text, margin:'0 0 24px' }}>
                Are you sure, You want to reject this candidate's admission?
              </p>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button onClick={() => setShowRejectModal(false)}
                  style={{ background:'#6b7280', color:'#fff', border:'none', padding:'10px 26px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  No
                </button>
                <button onClick={handleRejectConfirm}
                  style={{ background:V.red, color:'#fff', border:'none', padding:'10px 26px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Yes, Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SUCCESS ALERT — mirrors ucAlertBox / mpeAlertBox
          OK button redirects to /college/admission/confirm (CloseAlertBox)
         ════════════════════════════════════════════════════════════════════ */}
      {alertMsg && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:12, maxWidth:400, width:'100%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ background:V.navy, padding:'13px 20px' }}>
              <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Information</span>
            </div>
            <div style={{ padding:'28px 24px', textAlign:'center' }}>
              <i className="fas fa-check-circle" style={{ color:V.primary, fontSize:36, display:'block', marginBottom:12 }}/>
              <p style={{ fontSize:15, color:V.text, margin:'0 0 24px', fontWeight:600 }}>{alertMsg}</p>
              <button onClick={handleAlertOk}
                style={{ background:V.primary, color:'#fff', border:'none', padding:'10px 32px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
