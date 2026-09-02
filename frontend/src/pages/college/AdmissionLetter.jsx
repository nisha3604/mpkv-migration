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
 * AdmissionLetter — mirrors AdmissionLetter.aspx exactly.
 * SP: Admission_GetAdmissionSummary  @ReportingStatus='Y'  @Flag='PrintAdmissionLetter'
 *
 * Sections:
 *  1. Personal Details + Merit Ranks
 *  2. Admission Details (allotment phase)
 *  3. Undertaking By Candidate (6 clauses) — footer: Printed By/On
 *  4. Declaration by Institute (5 clauses) — footer: Reported By/On
 */
export default function AdmissionLetter() {
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
      .getAdmissionSummary({ candidateID: candidateId, collegeID: collegeId, phaseID: phaseId, flag: 'PrintAdmissionLetter' })
      .then(r => { if (r.data.success) setData(r.data); else setError(r.data.message || 'Failed to load.') })
      .catch(e => setError(e.response?.data?.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [candidateId, collegeId, phaseId])

  if (loading) return <Spinner />
  if (error)   return <ErrBox msg={error} />

  return (
    <div className="letter-page-root">
      <ToolBar
        title="Admission Letter"
        backUrl="/college/admission/admission-letter"
        navigate={navigate}
        onPrint={() => window.print()}
        btnLabel="Print Admission Letter"
        btnColor="#059669"
      />

      {data && (
        <div className="letter-wrap">
          <UnivHeader />

          <CardSection header="Personal Details">
            <PersonalDetails d={data} />
            <MeritRanks d={data} />
          </CardSection>

          <CardSection header={`Admission Details (${data.allotmentPhase || ''})`}>
            <AdmissionInfo
              d={data}
              remarkLabel="Remark"
              remarkValue={data.admissionComments}
            />
          </CardSection>

          <CardSection header="Undertaking By Candidate">
            <p className="ltr-intro">I herewith undertake that,</p>
            <ol className="ltr-ol">
              <li>I have submitted copies of all required documents to the Institute for admission purposes, and I shall tender all the required documents Original copies too for verification.</li>
              <li>If I fail to submit the documents within the stipulated time, then my admission will be denied/cancelled.</li>
              <li>If it is found that I have shown the fake document(s) and given false information, my admission will stand cancelled at any stage and further, I will be subjected to legal action as per the law.</li>
              <li>I agree to conform to rules, acts and laws enforced by Government from time to time. I will not behave in a manner that may result in compelling the authorities to take disciplinary action against me.</li>
              <li>The Institute administration has the right to expel, rusticate me from the Institute, for any infringement of the rules prescribed by Authorities/Government.</li>
              <li>This admission is taken by me as per my own choice.</li>
            </ol>
            <FooterRow2
              col1Label="Printed By"  col1Value={user?.userLoginID}
              col2Label="Printed On"  col2Value={data.printedOn}
            />
          </CardSection>

          <CardSection header="Declaration by Institute">
            <p className="ltr-intro">We hereby declare that,</p>
            <ol className="ltr-ol">
              <li>This candidate is admitting to our Institute from the academic year <strong>{ACADEMIC_YEAR}</strong> on verification of Candidate's Identity.</li>
              <li>This admission is confirmed with the consent of the Candidate and is provisional till the physical verification of the Original documents.</li>
              <li>It is mandatory for the candidate to submit/show Original copies of all the required documents asap to this Institute.</li>
              <li>The candidate has paid Fees (if any) as per our policy and the due receipt is given to him/her.</li>
              <li>Covid Safe behaviour is being followed at all the procedures.</li>
            </ol>
            <FooterRow2
              col1Label="Reported By" col1Value={data.reportedBy}
              col2Label="Reported On" col2Value={data.reportedOn}
            />
          </CardSection>
        </div>
      )}
      <LetterStyles />
    </div>
  )
}
