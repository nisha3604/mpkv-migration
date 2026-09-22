import { useEffect, useState } from 'react';
import { feeAdminApi } from '../../services/api';

const V = { navy: '#14212e', primary: '#059669', teal: '#0d9488' };

const COLS = [
  { label: 'App ID',           key: 'payeeApplicationID' },
  { label: 'Candidate Name',   key: 'payeeName' },
  { label: 'Purpose',          key: 'purpose' },
  { label: 'Transaction ID',   key: 'transactionID' },
  { label: 'Amount (₹)',       key: 'feeAmount' },
  { label: 'Payment Date',     key: 'paymentDate' },
  { label: 'Bank Ref No',      key: 'bankReferenceNo' },
  { label: 'PayGate ID',       key: 'payGateID' },
  { label: 'Status',           key: 'transactionStatus' },
  { label: 'Refund Req ID',    key: 'refundRequestID' },
  { label: 'Refund PayGate',   key: 'refundPayGateID' },
  { label: 'Refund BRN',       key: 'refundBankRRN' },
  { label: 'Refund Init Date', key: 'refundInitiatedDate' },
  { label: 'Refunded Date',    key: 'refundedDate' },
  { label: 'ChargeBack Date',  key: 'chargeBackDate' },
];

export default function CheckRefundStatus() {
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [checking,    setChecking]    = useState(false);
  const [checkResult, setCheckResult] = useState(null); // { success, message, count }
  const [error,       setError]       = useState('');

  // On mount: poll NSDL then load grid
  useEffect(() => { init(); }, []);

  const init = async () => {
    setLoading(true);
    setError('');
    setCheckResult(null);
    try {
      // 1. Poll NSDL for status updates
      setChecking(true);
      const pollRes = await feeAdminApi.checkRefundStatus();
      setCheckResult(pollRes.data);
      setChecking(false);

      // 2. Load refunded transactions grid
      const listRes = await feeAdminApi.getRefundedTransactions();
      setRows(listRes.data?.items ?? []);
    } catch {
      setError('Server error while checking refund statuses. Please try again.');
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="rounded-t-lg px-6 py-4 mb-4 flex items-center justify-between" style={{ background: V.navy }}>
        <div>
          <h1 className="text-white text-xl font-semibold tracking-wide">Check Refund Status</h1>
          <p className="text-gray-300 text-sm mt-1">
            Auto-polls NSDL on load and displays all refunded transactions.
          </p>
        </div>
        <button
          onClick={init}
          disabled={loading || checking}
          className="text-sm px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition disabled:opacity-50"
        >
          {loading || checking ? 'Checking…' : '↺ Refresh & Poll'}
        </button>
      </div>

      {/* NSDL poll result banner */}
      {checking && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded bg-blue-50 border border-blue-200 text-blue-700 text-sm">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Polling NSDL for pending refund statuses…
        </div>
      )}

      {checkResult && !checking && (
        <div className={`mb-4 px-4 py-3 rounded text-sm font-medium ${checkResult.success ? 'bg-green-50 border border-green-300 text-green-700' : 'bg-yellow-50 border border-yellow-300 text-yellow-700'}`}>
          {checkResult.message}
          {checkResult.success && checkResult.count !== undefined && (
            <span className="ml-2 font-bold">({checkResult.count} checked)</span>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
      )}

      {/* Grid */}
      {loading && !checking ? (
        <div className="text-center py-16 text-gray-400">Loading refunded transactions…</div>
      ) : rows.length === 0 && !loading ? (
        <div className="text-center py-16 text-gray-400">No refunded transactions found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full text-sm border-collapse bg-white">
            <thead>
              <tr style={{ background: V.navy }}>
                <th className="px-3 py-2 text-left text-white font-medium text-xs whitespace-nowrap">Sr.</th>
                {COLS.map(c => (
                  <th key={c.key} className="px-3 py-2 text-left text-white font-medium text-xs whitespace-nowrap">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.transactionID ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                  {COLS.map(c => (
                    <td key={c.key} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {row[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
