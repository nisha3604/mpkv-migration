import { useEffect, useState, useCallback } from 'react';
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

export default function RefundDuplicateTransactions() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [acting,  setActing]  = useState(null); // transactionID being acted on
  const [toast,   setToast]   = useState(null); // { ok, msg }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await feeAdminApi.getDuplicateTransactions();
      setRows(res.data?.items ?? []);
    } catch {
      setError('Failed to load duplicate transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (ok, msg) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleInitiate = async (row) => {
    if (!window.confirm(`Initiate refund for Transaction ID ${row.transactionID}?`)) return;
    setActing(row.transactionID);
    try {
      const res = await feeAdminApi.initiateRefund({
        transactionID:          row.transactionID,
        refundRequestID:        '',
        refundPayGateID:        '',
        refundBankRRN:          '',
        refundInitiatedDateTime:'',
      });
      showToast(res.data?.success, res.data?.message ?? 'Done.');
      if (res.data?.success) load();
    } catch {
      showToast(false, 'Server error. Please try again.');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="rounded-t-lg px-6 py-4 mb-4 flex items-center justify-between" style={{ background: V.navy }}>
        <div>
          <h1 className="text-white text-xl font-semibold tracking-wide">
            Refund Duplicate Transactions
          </h1>
          <p className="text-gray-300 text-sm mt-1">
            Duplicate fee transactions eligible for refund.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-sm px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition"
        >
          {loading ? 'Refreshing…' : '↺ Refresh'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded text-sm font-medium ${toast.ok ? 'bg-green-50 border border-green-300 text-green-700' : 'bg-red-50 border border-red-300 text-red-700'}`}>
          {toast.msg}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading transactions…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No duplicate transactions found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full text-sm border-collapse bg-white">
            <thead>
              <tr style={{ background: V.navy }}>
                <th className="px-3 py-2 text-left text-white font-medium text-xs whitespace-nowrap">Sr.</th>
                <th className="px-3 py-2 text-left text-white font-medium text-xs whitespace-nowrap">Action</th>
                {COLS.map(c => (
                  <th key={c.key} className="px-3 py-2 text-left text-white font-medium text-xs whitespace-nowrap">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.transactionID ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2">
                    {row.isEligibleForRefund ? (
                      <button
                        onClick={() => handleInitiate(row)}
                        disabled={acting === row.transactionID}
                        className="px-3 py-1 rounded text-xs text-white font-medium whitespace-nowrap disabled:opacity-50"
                        style={{ background: V.primary }}
                      >
                        {acting === row.transactionID ? 'Processing…' : 'Initiate Refund'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not eligible</span>
                    )}
                  </td>
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
