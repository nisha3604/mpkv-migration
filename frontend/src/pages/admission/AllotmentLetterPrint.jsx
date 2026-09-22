import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { admissionApi } from '../../services/api'

/**
 * AllotmentLetterPrint — mirrors AllotmentLetterPrint.aspx
 *
 * Opened as a popup from CheckAllotmentStatus → Download Allotment Letter button.
 * URL: /admission/allotment-letter-print?p1={candidateId}&p2={hash}&r1={phaseId}
 *
 * Security: P1 (CandidateID) is verified by comparing hash(P1) == P2 on the backend.
 * No session/auth token needed — same as old project.
 *
 * Auto-prints via window.print() once data loads (mirrors <body onload="PrintWindow();">).
 *
 * Layout mirrors the old two-page letter:
 *   Page 1: Header + Allotment details + Weightage table + Notes + Dates
 *   Page 2: Conditions + Undertaking
 */

const BACKEND = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:7002'

function imgUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${BACKEND}${url}`
}

export default function AllotmentLetterPrint() {
  const [params]  = useSearchParams()
  const [data,    setData]    = useState(null)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(true)
  const printed   = useRef(false)

  const p1 = params.get('p1') ?? ''
  const p2 = params.get('p2') ?? ''
  const r1 = params.get('r1') ?? ''

  useEffect(() => {
    if (!p1 || !p2 || !r1) { setError('Invalid URL. Please try again from the allotment status page.'); setLoading(false); return }

    admissionApi.getAllotmentLetterData(p1, p2, r1)
      .then(res => {
        if (res.data?.success) {
          setData(res.data)
        } else {
          setError(res.data?.message || 'Failed to load allotment letter.')
        }
      })
      .catch(() => setError('Server error. Please try again.'))
      .finally(() => setLoading(false))
  }, [p1, p2, r1])

  // Auto-print once data is ready — mirrors <body onload="PrintWindow();">
  useEffect(() => {
    if (data && !printed.current) {
      printed.current = true
      setTimeout(() => window.print(), 600)  // small delay for images to render
    }
  }, [data])

  if (loading) return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: 60 }}>
      <p>Loading allotment letter…</p>
    </div>
  )

  if (error || !data) return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: 60, color: '#dc2626' }}>
      <h3>Error</h3>
      <p>{error || 'No data found.'}</p>
    </div>
  )

  const d = data

  return (
    <div id="allotment-letter" style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#000', margin: '0 auto', maxWidth: 860, padding: '20px 30px' }}>

      {/* ── PAGE 1 ─────────────────────────────────────────────────────── */}
      <div style={{ pageBreakAfter: 'always' }}>

        {/* Header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <tbody>
            <tr>
              <td style={{ width: '10%', verticalAlign: 'middle', textAlign: 'center' }}>
                <img src="/mpkv-logo.png" alt="MPKV Logo" style={{ height: 75 }}
                  onError={e => { e.target.style.display = 'none' }} />
              </td>
              <td style={{ width: '90%', textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{ fontSize: 15, fontWeight: 'bold' }}>Mahatma Phule Krishi Vidyapeeth (MPKV), Rahuri</div>
                <div style={{ fontSize: 12 }}>Faculty of Agriculture Technology Education</div>
                <div style={{ fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>
                  PROVISIONAL ALLOTMENT LETTER
                </div>
                <div style={{ fontSize: 12, marginTop: 2 }}>{d.allotmentPhase}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <hr style={{ border: '1px solid #000', marginBottom: 12 }} />

        {/* Candidate salutation + photo/sign */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
          <tbody>
            <tr>
              <td style={{ width: '88%', verticalAlign: 'top' }}>
                <p style={{ margin: '0 0 6px' }}>To,</p>
                <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>Dear Candidate Shri/Smt. : {d.candidateName}</p>
                <p style={{ margin: '0 0 4px' }}>
                  You have been provisionally allotted to <strong>{d.allottedCollege}</strong> for the
                  academic year as per the details below.
                </p>
              </td>
              <td style={{ width: '12%', verticalAlign: 'top', textAlign: 'center' }}>
                {d.photoURL && (
                  <img src={imgUrl(d.photoURL)} alt="Photograph"
                    style={{ width: 68, height: 87, objectFit: 'cover', border: '1px solid #999', display: 'block', marginBottom: 4 }} />
                )}
                <div style={{ fontSize: 10, textAlign: 'center' }}>Photograph</div>
                {d.signURL && (
                  <img src={imgUrl(d.signURL)} alt="Signature"
                    style={{ width: 68, height: 30, objectFit: 'contain', border: '1px solid #999', display: 'block', marginTop: 8, marginBottom: 4 }} />
                )}
                <div style={{ fontSize: 10, textAlign: 'center' }}>Signature</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Details grid */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #999', marginBottom: 14, fontSize: 12 }}>
          <tbody>
            {[
              ['Application ID',                                d.applicationID],
              ['Gender',                                         d.gender],
              ['Name of District (Domicile)',                    d.domicileDistrict],
              ["Candidate's Selected Category / Special Cat.",   d.category],
              ['Allotted Category / Special Category',           d.allottedCategory],
              ['Allotted Gender Quota',                          d.allottedType],
            ].map(([label, value], i) => (
              <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '5px 10px', width: '55%', fontWeight: 600, background: '#f9f9f9', textAlign: 'right' }}>{label}</td>
                <td style={{ padding: '5px 10px' }}>{value || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Weightage points table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #999', marginBottom: 14, fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#14212e', color: '#fff' }}>
              <th style={{ padding: '7px 10px', textAlign: 'left', width: '6%' }}>Sr.</th>
              <th style={{ padding: '7px 10px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '7px 10px', textAlign: 'center', width: '12%' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['1.', 'Academic Marks Standard',                                                                                                                                                                                            d.academicWeightage],
              ['2.', '7/12 of agricultural land given by Talathi/Patwari in the year 2020-2021 or 2021-2022 / Khasra in the name of candidate or in the name of his/her parents or his/her grandparents',                                d.weightage712],
              ['3.', 'NCC / MCC / Scout Guide Certificate (Certificate of Taluka / District Commandant / Headmaster) (Class 8th to 10th)',                                                                                              d.nccWeightage],
              ['4.', 'Participation in Taluka / District Level Sports / Cultural Proficiency / Debate / Drama etc. (Class 8th to 10th)',                                                                                                d.sportWeightage],
              ['5.', 'Son / Daughter of Current / Ex. Employee of State Agricultural University',                                                                                                                                       d.mpkvEmployeeWeightage],
            ].map(([sr, desc, val], i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '6px 10px', textAlign: 'center' }}>{sr}</td>
                <td style={{ padding: '6px 10px', textAlign: 'justify' }}>{desc}</td>
                <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600 }}>{val || '0'}</td>
              </tr>
            ))}
            <tr style={{ background: '#f0f9ff', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ padding: '7px 10px', textAlign: 'right' }}>Total Points</td>
              <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800, fontSize: 14 }}>{d.totalWeightage || '0'}</td>
            </tr>
          </tbody>
        </table>

        {/* Notes A-E */}
        <div style={{ fontSize: 12, marginBottom: 14 }}>
          <p style={{ margin: '0 0 6px', fontWeight: 'bold', textDecoration: 'underline' }}>Note:</p>
          {[
            'This is a Provisional Allotment Letter. Your admission will be confirmed only after verification of documents by the allotted school/college.',
            'You must report to the allotted school within the prescribed reporting date along with all original documents and fees.',
            'Failure to report within the stipulated time will result in cancellation of your allotment for this round.',
            'If you wish to refuse this allotment, you must do so online and pay the applicable refusal fee before the deadline.',
            'The University reserves the right to modify allotments based on eligibility or document verification outcomes.',
          ].map((note, i) => (
            <p key={i} style={{ margin: '0 0 4px', textAlign: 'justify' }}>
              {String.fromCharCode(65 + i)}. {note}
            </p>
          ))}
        </div>

        {/* Allotment date + reporting date */}
        <p style={{ fontSize: 12, margin: '0 0 4px' }}>
          <strong>Date of Allotment:</strong> {d.allotmentDate || '—'}
        </p>
        <p style={{ fontSize: 12, margin: '0 0 16px', color: '#dc2626', fontWeight: 600 }}>
          Reporting date at allotted school is from {d.admissionSchedule || '—'}
        </p>

        {/* Authority signature */}
        <table style={{ width: '100%', marginTop: 20 }}>
          <tbody>
            <tr>
              <td style={{ width: '60%' }} />
              <td style={{ width: '40%', textAlign: 'center' }}>
                <img src="/images/Sign.png" alt="Registrar Signature" style={{ height: 50, marginBottom: 4 }}
                  onError={e => { e.target.style.display = 'none' }} />
                <div style={{ fontSize: 12, fontWeight: 'bold' }}>राजेंद्रकुमार पाटील</div>
                <div style={{ fontSize: 12 }}>कुलसचिव</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── PAGE 2 ─────────────────────────────────────────────────────── */}
      <div>
        <p style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', fontSize: 14, marginBottom: 14 }}>
          CONDITIONS FOR CENTRALIZED ALLOTMENT TO ATS
        </p>
        <ol style={{ fontSize: 12, paddingLeft: 20, textAlign: 'justify' }}>
          {[
            'The candidate must report to the allotted school/college within the prescribed schedule along with all original documents, Provisional Allotment Letter, and prescribed fees.',
            'At the time of reporting, the candidate must submit a copy of this Provisional Allotment Letter to the school authority.',
            'The school authority will verify original documents and confirm admission subject to eligibility.',
            "If the candidate fails to report within the stipulated schedule, the candidate's allotment shall be cancelled for all remaining rounds except the Spot Round.",
            'If the candidate wishes to refuse the allotted seat, they must do so online through the admission portal and pay the applicable refusal fee to MPKV, Rahuri.',
            'The allotment process is fully computerized and is based on the merit list prepared by the University.',
            'The school authority is responsible for verifying the authenticity of all documents submitted by the candidate.',
            'If any discrepancy is found in merit or eligibility at any stage, the University reserves the right to cancel the admission.',
            'Fees must be remitted to the school only after verification and confirmation of documents by the school authority.',
            'The competent authority reserves the right to modify seat allotments in the interest of justice and as per statutory requirements.',
          ].map((cond, i) => (
            <li key={i} style={{ marginBottom: 6 }}>{cond}</li>
          ))}
        </ol>

        <p style={{ fontSize: 12, marginTop: 14, textAlign: 'justify' }}>
          I have read and understood the above conditions and I hereby accept the allotment.
        </p>

        <p style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', fontSize: 14, margin: '24px 0 10px' }}>
          UNDERTAKING
        </p>
        <p style={{ fontSize: 12, textAlign: 'justify', marginBottom: 30 }}>
          I, <strong>{d.candidateName}</strong>, hereby declare that the information provided by me in the
          application form is true and correct to the best of my knowledge. I undertake to abide by all
          rules and regulations of Mahatma Phule Krishi Vidyapeeth, Rahuri, and the allotted
          school/college. I am aware that any false information or non-compliance with the prescribed
          conditions will result in cancellation of my admission.
        </p>

        <table style={{ width: '100%', marginTop: 24, fontSize: 12 }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'bottom', textAlign: 'center', paddingTop: 60 }}>
                School Authority Signature with Seal
              </td>
              <td style={{ width: '50%', verticalAlign: 'bottom', textAlign: 'center', paddingTop: 60 }}>
                <div>Signature of Candidate</div>
                <div style={{ fontWeight: 'bold', marginTop: 4 }}>{d.candidateName}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          #allotment-letter { padding: 10mm 15mm; max-width: 100%; }
        }
        @page { size: A4; margin: 10mm; }
      `}</style>
    </div>
  )
}
