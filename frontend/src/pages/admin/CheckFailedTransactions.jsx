import { useEffect, useState } from 'react';
import { feeAdminApi } from '../../services/api';

const V = { navy: '#14212e', primary: '#059669', teal: '#0d9488' };

export default function CheckFailedTransactions() {
  const [dates,    setDates]    = useState([]);
  const [selected, setSelected] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null); // { success, message, count }
  const [fetchErr, setFetchErr] = useState('');

  useEffect(() => {
    feeAdminApi.getFailedTransactionDates()
      .then(res => setDates(res.data?.items ?? []))
      .catch(() => setFetchErr('Failed to load date list.'));
  }, []);

  const handleCheck = async () => {
    if (!selected) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await feeAdminApi.checkFailedTransactions(selected);
      setResult(res.data);
    } catch {
      setResult({ success: false, message: 'Server error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="rounded-t-lg px-6 py-4 mb-6" style={{ background: V.navy }}>
        <h1 className="text-white text-xl font-semibold tracking-wide">
          Check Failed Transactions
        </h1>
        <p className="text-gray-300 text-sm mt-1">
          Re-verify failed payment transactions with NSDL/BillDesk by date.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-5">
        {fetchErr && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm">
            {fetchErr}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Transaction Date
          </label>
          <select
            value={selected}
            onChange={e => { setSelected(e.target.value); setResult(null); }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ focusRingColor: V.teal }}
          >
            <option value="">-- Select Date --</option>
            {dates.map(d => (
              <option key={d.value} value={d.value}>{d.text}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCheck}
          disabled={!selected || loading}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-md text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
          style={{ background: loading ? '#6b7280' : V.teal }}
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {loading ? 'Checking…' : 'Check Transactions'}
        </button>

        {result && (
          <div
            className={`px-4 py-3 rounded text-sm font-medium ${
              result.success
                ? 'bg-green-50 border border-green-300 text-green-700'
                : 'bg-red-50 border border-red-300 text-red-700'
            }`}
          >
            {result.message}
            {result.success && result.count !== undefined && (
              <span className="ml-2 font-bold">({result.count} transactions processed)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
