import { useState } from 'react';
import { feeAdminApi } from '../../services/api';

const V = { navy: '#14212e', primary: '#059669', teal: '#0d9488', amber: '#d97706' };

const COLS = [
  { label: 'Transaction ID',   key: 'transactionID' },
  { label: 'Purpose',          key: 'purpose' },
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

export default function RefundTransaction() {
  const [input,   setInput]   = useState('');
  const [step,    setStep]    = useState(1);       // 1=search, 2=results
  const [data,    setData]    = useState(null);    // FeeAdminListResponse
  const [loading, setLoading] = useState(false);
  const [searchErr, setSearchErr] = useState('');
  const [acting,  setActing]  = useState(null);   // { txId, action }
  const [toast,   setToast]   = useState(null);

  const showToast = (ok, msg) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSearch = async () => {
    const v = input.trim();
    if (!v) return;
    setLoading(true);
    setSearchErr('');
    setData(null);
    try {
      const res = await feeAdminApi.getTransactionsForRefund(v);
      const d = res.data;
      if (!d?.success || (d.items ?? []).length === 0) {
        setSearchErr(d?.message || 'No transactions found for this Application ID / Transaction ID.');
        setStep(1);
      } else {
        setData(d);
        setStep(2);
      }
    } catch {
      setSearchErr('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiate = async (row) => {
    if (!window.confirm(`Initiate refund for Transaction ID ${row.transactionID}?`)) return;
    setActing({ txId: row.transactionID, action: 'initiate' });
    try {
      const res = await feeAdminApi.initiateRefund({
        transactionID:           row.transactionID,
        refundRequestID:         '',
        refundPayGateID:         '',
        refundBankRRN:           '',
        refundInitiatedDateTime: '',
      });
      showToast(res.data?.success, res.data?.message ?? 'Done.');
      if (res.data?.success) {
        // Re-fetch
        const r2 = await feeAdminApi.getTransactionsForRefund(input.trim());
        if (r2.data?.success) setData(r2.data);
      }
    } catch {
      showToast(false, 'Server error. Please try again.');
    } finally {
      setActing(null);
    }
  };

  const handleChargeBack = async (row) => {
    if (!window.confirm(`Accept ChargeBack for Transaction ID ${row.transactionID}?`)) return;
    setActing({ txId: row.transactionID, action: 'chargeback' });
    try {
      const res = await feeAdminApi.acceptChargeBack(row.transactionID);
      showToast(res.data?.success, res.data?.message ?? 'Done.');
      if (res.data?.success) {
        const r2 = await feeAdminApi.getTransactionsForRefund(input.trim());
        if (r2.data?.success) setData(r2.data);
      }
    } catch {
      showToast(false, 'Server error. Please try again.');
    } finally {
      setActing(null);
    }
  };

  const isActing = (txId, action) => acting?.txId === txId && acting?.action === action;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="rounded-t-lg px-6 py-4 mb-4" style={{ background: V.navy }}>
        <h1 className="text-white text-xl font-semibold tracking-wide">Refund Transaction</h1>
        <p className="text-gray-300 text-sm mt-1">Search by Application ID or Transaction ID to initiate refund / accept chargeback.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded text-sm font-medium ${toast.ok ? 'bg-green-50 border border-green-300 text-green-700' : 'bg-red-50 border border-red-300 text-red-700'}`}>
          {toast.msg}
        </div>
      )}

      {/* Step 1 — Search */}
      <div className="bg-white rounded-lg shadow p-5 mb-5">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application ID or Transaction ID
            </label>
            <input
              value={input}
              onChange={e => { setInput(e.target.value); setSearchErr(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Application ID or Transaction ID"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!input.trim() || loading}
            className="px-5 py-2 rounded-md text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            style={{ background: V.teal }}
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
          {step === 2 && (
            <button
              onClick={() => { setStep(1); setData(null); setInput(''); setSearchErr(''); }}
              className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        {searchErr && (
          <div className="mt-3 bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded text-sm">
            {searchErr}
          </div>
        )}
      </div>

      {/* Step 2 — Candidate info + grid */}
      {step === 2 && data && (
        <>
          {/* Candidate info card */}
          <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-8 border-l-4" style={{ borderColor: V.teal }}>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Application ID</p>
              <p className="text-base font-semibold text-gray-800">{data.payeeApplicationID || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Candidate Name</p>
              <p className="text-base font-semibold text-gray-800">{data.payeeName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Transactions</p>
              <p className="text-base font-semibold text-gray-800">{data.items.length}</p>
            </div>
          </div>

          {/* Transactions grid */}
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
                {data.items.map((row, i) => (
                  <tr key={row.transactionID ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        {row.isEligibleForRefund && (
                          <>
                            <button
                              onClick={() => handleInitiate(row)}
                              disabled={!!acting}
                              className="px-3 py-1 rounded text-xs text-white font-medium whitespace-nowrap disabled:opacity-50"
                              style={{ background: V.primary }}
                            >
                              {isActing(row.transactionID, 'initiate') ? 'Processing…' : 'Initiate Refund'}
                            </button>
                            <button
                              onClick={() => handleChargeBack(row)}
                              disabled={!!acting}
                              className="px-3 py-1 rounded text-xs text-white font-medium whitespace-nowrap disabled:opacity-50"
                              style={{ background: V.amber }}
                            >
                              {isActing(row.transactionID, 'chargeback') ? 'Processing…' : 'Accept ChargeBack'}
                            </button>
                          </>
                        )}
                        {!row.isEligibleForRefund && (
                          <span className="text-xs text-gray-400 italic">Not eligible</span>
                        )}
                      </div>
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
        </>
      )}
    </div>
  );
}
