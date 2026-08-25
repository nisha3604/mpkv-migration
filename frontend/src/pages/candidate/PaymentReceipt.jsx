import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { feeApi } from '../../services/api'

/**
 * PaymentReceipt — mirrors Fee/PaymentReceipt.aspx exactly.
 *
 * Opened as a new window from PaymentHistory print button.
 * Auto-triggers window.print() on load — same as old: body onload="window.print()"
 *
 * No Navbar/layout — raw print page.
 * Route: /candidate/payment-receipt/:transactionId
 */
export default function PaymentReceipt() {
  const { transactionId } = useParams()
  const [tx,      setTx]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!transactionId) { setError('Invalid transaction ID.'); setLoading(false); return }
    feeApi.getReceipt(transactionId)
      .then(res => setTx(res.data))
      .catch(err => setError(err.response?.data?.message ?? 'Transaction not found.'))
      .finally(() => setLoading(false))
  }, [transactionId])

  // Auto-print once data loads — mirrors body onload="window.print()"
  useEffect(() => {
    if (!loading && tx) setTimeout(() => window.print(), 300)
  }, [loading, tx])

  if (loading) return (
    <div style={{ textAlign:'center', padding:40, fontFamily:'Arial,sans-serif' }}>
      <p>Preparing receipt...</p>
    </div>
  )

  if (error || !tx) return (
    <div style={{ textAlign:'center', padding:40, fontFamily:'Arial,sans-serif' }}>
      <p>{error || 'Transaction not found.'}</p>
    </div>
  )

  const td  = { border:'1px solid #000', padding:'6px 10px', fontSize:13 }
  const tdr = { ...td, textAlign:'right', fontWeight:600, width:'35%', background:'#f5f5f5' }
  const tdv = { ...td, fontWeight:700 }

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 10mm; }
          .no-print { display: none !important; }
          body { font-size: 12px; }
        }
        body { font-family: Arial, sans-serif; margin: 0; padding: 12px; }
        table { border-collapse: collapse; width: 100%; }
      `}</style>

      {/* Print / Close buttons — hidden on actual print */}
      <div className="no-print" style={{ textAlign:'right', padding:'8px', borderBottom:'1px solid #ccc', marginBottom:12 }}>
        <button onClick={() => window.print()}
          style={{ background:'#059669', color:'#fff', border:'none', padding:'8px 20px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer' }}>
          🖨 Print
        </button>
        <button onClick={() => window.close()}
          style={{ background:'#6b7280', color:'#fff', border:'none', padding:'8px 16px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', marginLeft:8 }}>
          ✕ Close
        </button>
      </div>

      {/* ── University header — same as old project ─────────────────── */}
      <table style={{ marginBottom:0 }}>
        <tbody>
          <tr>
            <td style={{ width:'12%', textAlign:'center', border:'none', padding:6 }}>
              <img src="/MPKVLogo.png" style={{ height:70 }} alt="MPKV"/>
            </td>
            <td style={{ textAlign:'center', border:'none', padding:6 }}>
              <div style={{ fontSize:14, fontWeight:500 }}>महात्मा फुले कृषि विद्यापीठ, राहुरी</div>
              <div style={{ fontSize:13, fontWeight:500 }}>Mahatma Phule Agriculture University, Rahuri</div>
              <div style={{ fontSize:13, fontWeight:600, paddingTop:6 }}>
                Online Agriculture Diploma / Polytechnic / Mali Certificate Admissions - 2026
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Transaction Details — same fields as old PaymentReceipt.aspx ── */}
      <table style={{ marginTop:12 }}>
        <tbody>
          <tr>
            <th colSpan={2} style={{ ...td, background:'#14212e', color:'#fff', textAlign:'center', fontSize:14, fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase' }}>
              Transaction Details
            </th>
          </tr>
          <tr>
            <td style={tdr}>Transaction ID</td>
            <td style={tdv}>{tx.transactionID}</td>
          </tr>
          <tr>
            <td style={tdr}>Payee ID</td>
            <td style={tdv}>{tx.payeeApplicationID}</td>
          </tr>
          <tr>
            <td style={tdr}>Payee Name</td>
            <td style={tdv}>{tx.payeeName}</td>
          </tr>
          <tr>
            <td style={tdr}>Fee Amount</td>
            <td style={tdv}>₹ {tx.feeAmount}</td>
          </tr>
          <tr>
            <td style={tdr}>Service Charge</td>
            <td style={tdv}>₹ {tx.serviceCharge || '0.00'}</td>
          </tr>
          <tr>
            <td style={tdr}>Total Amount</td>
            <td style={tdv}>₹ {tx.totalAmount}</td>
          </tr>
          <tr>
            <td style={tdr}>Transaction Date</td>
            <td style={tdv}>{tx.transactionDate || '—'}</td>
          </tr>
          <tr>
            <td style={tdr}>Payment Date</td>
            <td style={tdv}>{tx.paymentDate || '—'}</td>
          </tr>
          <tr>
            <td style={tdr}>Payment Status</td>
            <td style={{ ...tdv, color: tx.transactionStatus?.toLowerCase() === 'paid' ? '#166534' : '#dc2626' }}>
              {tx.transactionStatus || '—'}
            </td>
          </tr>
          <tr>
            <td style={tdr}>Purpose</td>
            <td style={tdv}>{tx.purpose}</td>
          </tr>
          <tr>
            <td style={tdr}>Payment Gateway</td>
            <td style={tdv}>{tx.paymentGateway || '—'}</td>
          </tr>
          <tr>
            <td style={tdr}>Bank Reference No.</td>
            <td style={tdv}>{tx.bankRefereneceNo || tx.bankReferenceNo || '—'}</td>
          </tr>
        </tbody>
      </table>
    </>
  )
}
