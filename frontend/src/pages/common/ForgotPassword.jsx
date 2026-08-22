import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicLayout from '../../components/PublicLayout'

/**
 * ForgotPassword — mirrors ForgotPassword.aspx exactly.
 *
 * Shows 3 radio options (same as old rbnlstResetPassword):
 *   1 = Security Question
 *   2 = OTP via Email
 *   3 = OTP via Mobile
 *
 * On Proceed → navigate to /reset-password?method=1|2|3
 */
export default function ForgotPassword() {
  const navigate = useNavigate()
  const [method, setMethod] = useState('1')
  const [error,  setError]  = useState('')

  const options = [
    {
      value: '1',
      icon:  'fa-shield-alt',
      label: 'Security Question',
      desc:  'Answer your registered security question to reset password',
    },
    {
      value: '2',
      icon:  'fa-envelope',
      label: 'OTP via E-Mail ID',
      desc:  'Receive a One-Time Password on your registered email address',
    },
    {
      value: '3',
      icon:  'fa-mobile-alt',
      label: 'OTP via Mobile Number',
      desc:  'Receive a One-Time Password on your registered mobile number',
    },
  ]

  const handleProceed = e => {
    e.preventDefault()
    if (!method) { setError('Please select a reset method.'); return }
    navigate(`/reset-password?method=${method}`)
  }

  return (
    <PublicLayout>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-md mx-auto">

          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-lock text-white text-2xl" />
              </div>
              <h1 className="text-white text-xl font-bold">Forgot Password</h1>
              <p className="text-emerald-100 text-sm mt-1">
                Select how you want to reset your password
              </p>
            </div>

            <form onSubmit={handleProceed} className="px-6 py-6 space-y-4">

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  <i className="fas fa-exclamation-circle" /> {error}
                </div>
              )}

              {/* Radio options — same as old rbnlstResetPassword */}
              <p className="text-[13px] font-semibold text-gray-700 mb-1">
                Choose reset method <span className="text-red-500">*</span>
              </p>

              <div className="space-y-3">
                {options.map(opt => (
                  <label
                    key={opt.value}
                    className={[
                      'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      method === opt.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={opt.value}
                      checked={method === opt.value}
                      onChange={() => { setMethod(opt.value); setError('') }}
                      className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 flex-shrink-0"
                    />
                    <div className="flex items-start gap-3">
                      <div className={[
                        'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                        method === opt.value ? 'bg-emerald-600' : 'bg-gray-100',
                      ].join(' ')}>
                        <i className={`fas ${opt.icon} text-sm ${method === opt.value ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2
                           bg-emerald-600 hover:bg-emerald-700
                           text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2"
              >
                <i className="fas fa-arrow-right" /> Proceed
              </button>

            </form>

            <div className="px-6 pb-5 flex items-center justify-between text-sm border-t border-gray-100 pt-4">
              <Link to="/login"           className="text-emerald-600 hover:underline">← Back to Login</Link>
              <Link to="/forgot-login-id" className="text-emerald-600 hover:underline">Forgot Login ID?</Link>
            </div>

          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
