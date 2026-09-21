import { useState } from 'react'
import { feeApi } from '../../services/api'

/**
 * AdminPaymentHistory
 *
 * Mirrors Admin/CheckApplicationID.aspx?Flag=CheckPaymentHistory
 *       + Fee/PaymentHistory.aspx (exact same UI for the transactions)
 *
 * Step 1 — Enter Application ID → Search
 * Step 2 — Show Paid + Failed transactions (same table layout as candidate PaymentHistory.jsx)
 *
 * SP: Fee_GetTransactionHistory(@PayeeID) via admin endpoint
 */
export default function AdminPaymentHistory() {

  // Step 1
  const [appId,     setAppId]     = useState('')
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')

  // Step 2
  const [paid,    setPaid]    = useState(null)   // null = not loaded yet
  const [failed,  setFailed]  = useState([])
  const [loadedFor, setLoadedFor] = useState('')  // appId that was searched

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

  // Search
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!appId.trim()) { setSearchErr('Please Enter Application ID.'); return }
    setSearching(true); setSearchErr(''); setPaid(null); setFailed([])
    try {
      const res = await feeApi.getAdminTransactionHistory(appId.trim())
      if (res.data?.success === false) {
        setSearchErr(res.data.message || 'Invalid Application ID.')
      } else {
        setPaid(res.data?.paidTransactions   ?? [])
        setFailed(res.data?.failedTransactions ?? [])
        setLoadedFor(appId.trim().toUpperCase())
      }
    } catch {
      setSearchErr('Server error. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const SecHeader = ({ title, icon, danger }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 22px',
      background: danger ? '#fef2f2' : V.tealLight,
      borderBottom: `1px solid ${danger ? '#fecaca' : V.tealBorder}`
    }}>
      <span style={{ width: 3, height: 14, background: danger ? V.danger : V.primary, borderRadius: 2, flexShrink: 0 }}/>
      <i className={icon} style={{ color: danger ? V.danger : V.teal, fontSize: 13 }}/>
      <span style={{ fontSize: 12, fontWeight: 700, color: danger ? V.danger : V.teal, textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</span>
    </div>
  )

  const Th = ({ children, w }) => (
    <th style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'left', whiteSpace: 'nowrap', width: w ?? 'auto' }}>{children}</th>
  )
  const Td = ({ children, center }) => (
    <td style={{ padding: '11px 14px', fontSize: 13, color: V.textPrimary, whiteSpace: 'nowrap', textAlign: center ? 'center' : 'left' }}>{children}</td>
  )

  return (
    <div style={{ fontFamily: 'inherit', background: V.bg, minHeight: '100vh', padding: 24 }}>

      {/* Page header */}
      <div style={{ background: V.primary, borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <i className="fas fa-receipt" style={{ color: '#fff', fontSize: 16 }}/>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>Check Payment History</h2>
      </div>

      {/* Step 1: Application ID input */}
      <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.06)', marginBottom: 20 }}>
        <div style={{ background: V.navy, padding: '10px 18px' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Enter Application ID</span>
        </div>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          {searchErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: V.danger, borderRadius: 7, padding: '9px 14px', marginBottom: 14, fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-exclamation-circle"/>{searchErr}
            </div>
          )}
          <form onSubmit={handleSearch}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: V.textPrimary, whiteSpace: 'nowrap' }}>Application ID :</label>
              <input
                value={appId}
                onChange={e => { setAppId(e.target.value.toUpperCase()); setSearchErr('') }}
                placeholder="Enter Application ID"
                maxLength={15}
                style={{ padding: '7px 12px', border: `1px solid ${V.border}`, borderRadius: 6, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', width: 200 }}
                onFocus={e => e.target.style.borderColor = V.primary}
                onBlur={e => e.target.style.borderColor = V.border}
              />
            </div>
          </form>
        </div>
        <div style={{ background: '#f8fafc', borderTop: `1px solid ${V.border}`, padding: '14px 20px', textAlign: 'center' }}>
          <button onClick={handleSearch} disabled={searching}
            style={{ background: searching ? '#d1fae5' : V.primary, color: '#fff', border: 'none', padding: '8px 28px', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: searching ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minWidth: 100 }}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Step 2: Transaction history */}
      {paid !== null && (
        <>
          {/* Candidate info bar */}
          <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 8, padding: '10px 18px', marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fas fa-user" style={{ color: V.teal }}/>
            <span style={{ fontWeight: 600 }}>Application ID: <strong style={{ color: V.primary }}>{loadedFor}</strong></span>
            <button onClick={() => { setPaid(null); setFailed([]); setLoadedFor('') }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: V.primary, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>
              Search again
            </button>
          </div>

          {/* Paid Transactions */}
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
                      <Th>Purpose</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paid.map((t, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${V.borderLight}`, background: i % 2 === 1 ? '#fafbfc' : '#fff' }}>
                        <Td center>{i + 1}.</Td>
                        <Td center>
                          <button title="Print Receipt"
                            onClick={() => window.open(`/candidate/payment-receipt/${t.transactionID}`, '_blank', 'width=800,height=600,resizable=yes,scrollbars=yes')}
                            style={{ background: 'transparent', border: `1px solid ${V.border}`, borderRadius: 6, padding: '5px 9px', cursor: 'pointer', color: V.primary, fontSize: 14 }}>
                            <i className="fas fa-print"/>
                          </button>
                        </Td>
                        <Td><span style={{ fontWeight: 600 }}>{t.transactionID}</span></Td>
                        <Td><span style={{ fontWeight: 700, color: V.primary }}>₹ {t.feeAmount}</span></Td>
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

          {/* Failed Transactions */}
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
                      <Th>Purpose</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {failed.map((t, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${V.borderLight}`, background: i % 2 === 1 ? '#fafbfc' : '#fff' }}>
                        <Td center>{i + 1}.</Td>
                        <Td><span style={{ fontWeight: 600 }}>{t.transactionID}</span></Td>
                        <Td><span style={{ fontWeight: 700, color: V.danger }}>₹ {t.feeAmount}</span></Td>
                        <Td>{t.transactionDate || '—'}</Td>
                        <Td><span style={{ color: V.danger, fontSize: 12.5 }}>{t.transactionResponse || t.transactionStatus || '—'}</span></Td>
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
          {paid.length === 0 && failed.length === 0 && (
            <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <i className="fas fa-receipt" style={{ fontSize: 36, color: V.textSecond, marginBottom: 12, display: 'block' }}/>
              <p style={{ fontSize: 14, color: V.textSecond, margin: 0 }}>No transaction records found for this candidate.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
