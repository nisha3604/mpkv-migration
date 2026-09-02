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
 * AdmissionCancellationLetter — mirrors AdmissionCancellationLetter.aspx exactly.
 * SP: Admission_GetAdmissionSummary  @ReportingStatus='C'  @Flag='PrintAdmissionCancellationLetter'
 *
 * Sections:
 *  1. Personal Details + Merit Ranks
 *  2. Admission Cancellation Details (allotment phase) — Reason for Cancellation from CancellationComments
 *  3. Declaration by Institute (2 clauses) — footer: Cancelled By/On
 *  4. Undertaking & Acknowledgement by Candidate (3 clauses) — footer: Printed By/On
 */
export default function AdmissionCancellationLetter() {
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
      .getAdmissionSummary({ candidateID: candidateId, collegeID: collegeId, phaseID: phaseId, flag: 'PrintAdmissionCancellationLetter' })
      .then(r => { if (r.data.success) setData(r.data); else setError(r.data.message || 'Failed to load.') })
      .catch(e => setError(e.response?.data?.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [candidateId, collegeId, phaseId])

  if (loading) return <Spinner />
  if (error)   return <ErrBox msg={error} />

  return (
    <div className="letter-page-root">
      <ToolBar
        title="Admission Cancellation Letter"
        backUrl="/college/admission/cancellation-letter"
        navigate={navigate}
        onPrint={() => window.print()}
        btnLabel="Print Admission Cancellation Letter"
        btnColor="#92400e"
      />

      {data && (
        <div className="letter-wrap">
          <UnivHeader />

          <CardSection header="Personal Details">
            <PersonalDetails d={data} />
            <MeritRanks d={data} />
          </CardSection>

          <CardSection header={`Admission Cancellation Details (${data.allotmentPhase || ''})`}>
            <AdmissionInfo
              d={data}
              remarkLabel="Reason for Cancellation"
              remarkValue={data.cancellationComments}
            />
          </CardSection>

          {/* Declaration by Institute */}
          <CardSection header="Declaration by Institute">
            <p className="ltr-intro">We herewith declare that,</p>
            <ol className="ltr-ol">
              <li>This admission is cancelled on the request of the student for the academic year <strong>{ACADEMIC_YEAR}</strong>.</li>
              <li>Due reason of cancellation is mentioned and candidate has made aware of the implication may arise of this.</li>
            </ol>
            <FooterRow2
              col1Label="Cancelled By" col1Value={data.cancelledBy}
              col2Label="Cancelled On" col2Value={data.cancelledOn}
            />
          </CardSection>

          {/* Undertaking & Acknowledgement by Candidate */}
          <CardSection header="Undertaking & Acknowledgement by Candidate">
            <p className="ltr-intro">I hereby undertake that,</p>
            <ol className="ltr-ol">
              <li>My admission for the academic year <strong>{ACADEMIC_YEAR}</strong> is cancelled as per my request.</li>
              <li>I am aware that once my admission is cancelled, my claim on the allotted seat will stand null and void.</li>
              <li>I have taken this decision without any pressure and have no concern regarding this.</li>
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
