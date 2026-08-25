import { useState, useEffect } from 'react'
import { feeApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * Payment History — mirrors Fee/PaymentHistory.aspx exactly.
 *
 * Two sections:
 *  1. Paid Transactions   (IsPaid = true)
 *  2. Failed Transactions (IsPaid = false)
 *
 * SP: Fee_GetTransactionHistory @PayeeID
 */
export default function PaymentHistory() {
  const { user }  = useAuth()

  const [paid,    setPaid]    = useState([])
  const [failed,  setFailed]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const V = {
    navy:        '#14212e',
    primary:     '#059669',
    teal:        '#0d9488',
    tealLight:   '#f0fdfb',
    tealBorder:  '#ccfbf1',
    border:      '#e2e8f0',
    borderLight: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecond:  '#64748b',
    danger:      '#ef4444',
    bg:          '#f5f6fa',
  }

  useEffect(() => {
    feeApi.getTransactionHistory()
      .then(res => {
        setPaid(res.data?.paidTransactions   ?? [])
        setFailed(res.data?.failedTransactions ?? [])
      })
      .catch(err => setError(err.response?.data?.message ?? 'Failed to load transaction history.'))
      .finally(() => setLoading(false))
  }, [])

  const SecHeader = ({ title, icon, danger }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 22px',
      background: danger ? '#fef2f2' : V.tealLight,
      borderBottom: `1px solid ${danger ? '#fecaca' : V.tealBorder}`
    }}>
      <span style={{ width: 3, height: 14, background: danger ? V.danger : V.primary, borderRadius: 2, flexShrink: 0 }}/>
      <i className={icon} style={{ color: danger ? V.danger : V.teal, fontSize: 13 }}/>
      <span style={{
        fontSize: 12, fontWeight: 700,
        color: danger ? V.danger : V.teal,
        textTransform: 'uppercase', letterSpacing: '.06em'
      }}>{title}</span>
    </div>
  )

  const Th = ({ children, w }) => (
    <th style={{
      padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#fff',
      textTransform: 'uppercase', letterSpacing: '.04em',
      textAlign: 'left', whiteSpace: 'nowrap',
      width: w ?? 'auto'
    }}>{children}</th>
  )
  const Td = ({ children, center }) => (
    <td style={{
      padding: '11px 14px', fontSize: 13, color: V.textPrimary,
      whiteSpace: 'nowrap', textAlign: center ? 'center' : 'left'
    }}>{children}</td>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color: V.textSecond, fontSize: 14 }}>Loading Transaction History...</p>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit', background: V.bg, minHeight: '100vh', padding: '24px' }}>

      {/* Page header */}
      <div style={{
        background: V.primary, borderRadius: 12,
        padding: '16px 24px', display: 'flex', alignItems: 'center',
        gap: 12, marginBottom: 20
      }}>
        <i className="fas fa-receipt" style={{ color: '#fff', fontSize: 16 }}/>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>Transaction History</h2>
      </div>

      {/* Global error */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13 }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }}/>{error}
        </div>
      )}

      {/* ── Paid Transactions ────────────────────────────────────────── */}
      {paid.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <SecHeader title="Paid Transactions" icon="fas fa-check-circle"/>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: V.navy }}>
                  <Th w="5%">Sr.</Th>
                  <Th w="7%">Print</Th>
                  <Th w="13%">Transaction ID</Th>
                  <Th w="11%">Amount (₹)</Th>
                  <Th w="14%">Payment Date</Th>
                  <Th w="14%">Bank Reference No.</Th>
                  <Th w="10%">Payment Gateway</Th>
                  <Th w="26%">Purpose</Th>
                </tr>
              </thead>
              <tbody>
                {paid.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${V.borderLight}`, background: i % 2 === 1 ? '#fafbfc' : '#fff' }}>
                    <Td center>{i + 1}.</Td>
                    <Td center>
                      <button
                        title="Print Receipt"
                        onClick={() => window.open(`/candidate/payment-receipt/${t.transactionID}`, '_blank', 'width=800,height=600,resizable=yes,scrollbars=yes')}
                        style={{ background:'transparent', border:`1px solid ${V.border}`, borderRadius:6, padding:'5px 9px', cursor:'pointer', color:V.primary, fontSize:14 }}>
                        <i className="fas fa-print"/>
                      </button>
                    </Td>
                    <Td>
                      <span style={{ fontWeight: 600 }}>{t.transactionID}</span>
                    </Td>
                    <Td>
                      <span style={{ fontWeight: 700, color: V.primary }}>₹ {t.feeAmount}</span>
                      {t.serviceCharge && t.serviceCharge !== '0.00' && (
                        <span style={{ fontSize: 11, color: V.textSecond, marginLeft: 4 }}>+₹{t.serviceCharge} svc</span>
                      )}
                    </Td>
                    <Td>{t.paymentDate || t.transactionDate || '—'}</Td>
                    <Td>{t.bankReferenceNo || '—'}</Td>
                    <Td>
                      <span style={{ display: 'inline-block', background: V.tealLight, color: V.teal, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, border: `1px solid ${V.tealBorder}` }}>
                        {t.paymentGateway || '—'}
                      </span>
                    </Td>
                    <Td>{t.purpose}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Failed Transactions ──────────────────────────────────────── */}
      {failed.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <SecHeader title="Failed / Pending Transactions" icon="fas fa-times-circle" danger/>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#b91c1c' }}>
                  <Th w="5%">Sr.</Th>
                  <Th w="13%">Transaction ID</Th>
                  <Th w="11%">Amount (₹)</Th>
                  <Th w="16%">Transaction Date</Th>
                  <Th w="35%">Message</Th>
                  <Th w="13%">Bank Ref. No.</Th>
                  <Th w="7%">Purpose</Th>
                </tr>
              </thead>
              <tbody>
                {failed.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${V.borderLight}`, background: i % 2 === 1 ? '#fafbfc' : '#fff' }}>
                    <Td center>{i + 1}.</Td>
                    <Td><span style={{ fontWeight: 600 }}>{t.transactionID}</span></Td>
                    <Td><span style={{ fontWeight: 700, color: V.danger }}>₹ {t.feeAmount}</span></Td>
                    <Td>{t.transactionDate || '—'}</Td>
                    <Td>
                      <span style={{ color: V.danger, fontSize: 12.5 }}>
                        {t.transactionResponse || t.transactionStatus || '—'}
                      </span>
                    </Td>
                    <Td>{t.bankReferenceNo || '—'}</Td>
                    <Td>{t.purpose}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No transactions */}
      {!loading && paid.length === 0 && failed.length === 0 && !error && (
        <div style={{
          background: '#fff', border: `1px solid ${V.border}`,
          borderRadius: 14, padding: '40px 24px', textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
        }}>
          <i className="fas fa-receipt" style={{ fontSize: 36, color: V.textSecond, marginBottom: 12, display: 'block' }}/>
          <p style={{ fontSize: 14, color: V.textSecond, margin: 0 }}>No transaction records found.</p>
        </div>
      )}

    </div>
  )
}
