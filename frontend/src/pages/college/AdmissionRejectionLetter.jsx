import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { admissionApi } from '../../services/api'
import {
  Spinner, ErrBox, ToolBar, UnivHeader, CardSection,
  PersonalDetails, MeritRanks, AdmissionInfo, FooterRow2,
  LetterStyles, ACADEMIC_YEAR,
} from './letterShared'

/**
 * AdmissionRejectionLetter — mirrors AdmissionRejectionLetter.aspx exactly.
 * SP: Admission_GetAdmissionSummary  @ReportingStatus='R'  @Flag='PrintAdmissionRejectionLetter'
 *
 * Sections:
 *  1. Personal Details + Merit Ranks
 *  2. Admission Rejection Details (allotment phase) — Reason for Rejection from AdmissionComments
 *  3. Declaration by Institute (2 clauses) — footer: Rejected By/On (= ReportedBy/ReportedOn in SP)
 *  4. Undertaking & Acknowledgement by Candidate (3 clauses) — footer: Printed By/On
 */
export default function AdmissionRejectionLetter() {
  const [sp]     = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const candidateId = parseInt(sp.get('p1') || '0')
  const collegeId   = parseInt(sp.get('c1') || '0')
  const phaseId     = parseInt(sp.get('r1') || '0')

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!candidateId || !collegeId || !phaseId) { setError('Invalid URL parameters.'); setLoading(false); return }
    admissionApi
      .getAdmissionSummary({ candidateID: candidateId, collegeID: collegeId, phaseID: phaseId, flag: 'PrintAdmissionRejectionLetter' })
      .then(r => { if (r.data.success) setData(r.data); else setError(r.data.message || 'Failed to load.') })
      .catch(e => setError(e.response?.data?.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [candidateId, collegeId, phaseId])

  if (loading) return <Spinner />
  if (error)   return <ErrBox msg={error} />

  return (
    <div className="letter-page-root">
      <ToolBar
        title="Admission Rejection Letter"
        backUrl="/college/admission/rejection-letter"
        navigate={navigate}
        onPrint={() => window.print()}
        btnLabel="Print Admission Rejection Letter"
        btnColor="#7c3aed"
      />

      {data && (
        <div className="letter-wrap">
          <UnivHeader />

          <CardSection header="Personal Details">
            <PersonalDetails d={data} />
            <MeritRanks d={data} />
          </CardSection>

          <CardSection header={`Admission Rejection Details (${data.allotmentPhase || ''})`}>
            <AdmissionInfo
              d={data}
              remarkLabel="Reason for Rejection"
              remarkValue={data.admissionComments}
            />
          </CardSection>

          {/* Declaration by Institute */}
          <CardSection header="Declaration by Institute">
            <p className="ltr-intro">We herewith declare that,</p>
            <ol className="ltr-ol">
              <li>This admission is rejected on the discrepancy found in the candidates actual details &amp; the information used for allotment.</li>
              <li>Due reason of rejection is mentioned and student has made aware of the implication arisen.</li>
            </ol>
            <FooterRow2
              col1Label="Rejected By" col1Value={data.reportedBy}
              col2Label="Rejected On" col2Value={data.reportedOn}
            />
          </CardSection>

          {/* Undertaking & Acknowledgement by Candidate */}
          <CardSection header="Undertaking & Acknowledgement by Candidate">
            <p className="ltr-intro">I hereby undertake that,</p>
            <ol className="ltr-ol">
              <li>My admission for the academic year <strong>{ACADEMIC_YEAR}</strong> is rejected on the valid ground.</li>
              <li>I am aware that due to rejection my allotted seat is now null &amp; void &amp; my claim on the allotted seat is stand cancelled.</li>
              <li>I will have to correct my details &amp; submit appropriate information if I want admission through this process.</li>
            </ol>
            <FooterRow2
              col1Label="Printed By" col1Value={user?.userLoginID}
              col2Label="Printed On" col2Value={data.printedOn}
            />
          </CardSection>
        </div>
      )}
      <LetterStyles />
    </div>
  )
}
