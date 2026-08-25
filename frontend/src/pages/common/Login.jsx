import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../services/api'
import PublicLayout from '../../components/PublicLayout'
import { normalizedEventValue } from '../../utils/formInput'

/**
 * Unified Login — same page for Candidate (91), College (61) and Admin (11/12).
 * After login, redirects to user.dashBoardPath returned by the API:
 *   Candidate → /candidate/dashboard
 *   College   → /college/dashboard
 *   Admin     → /admin/dashboard
 */
export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [form,    setForm]    = useState({ userLoginID: '', userPassword: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: normalizedEventValue(e) }))
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.userLoginID || !form.userPassword) {
      setError('Please enter your Login ID and Password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(form.userLoginID, form.userPassword)
      const { token, user } = res.data
      login(token, user)
      // Redirect based on user type — dashBoardPath from backend
      navigate(user.dashBoardPath || '/candidate/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message ?? err.response?.data ?? err.message ?? 'Login failed. Please try again.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="bg-gray-50 py-10 px-4 min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-[460px] rounded-2xl overflow-hidden border-[1.5px] border-gray-200 shadow-2xl bg-white">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-5 text-center">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-user text-white text-base" />
            </div>
            <h2 className="text-white text-lg font-semibold">Sign In</h2>
          </div>
          <div className="px-7 pt-5 pb-4">
            {error && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Login ID</label>
                <div className="relative">
                  <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input name="userLoginID" type="text" autoComplete="username" placeholder="Login ID"
                    value={form.userLoginID} onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border-[1.5px] border-emerald-100 rounded-lg text-sm text-gray-900 bg-emerald-50 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input name="userPassword" type={showPwd ? 'text' : 'password'} autoComplete="current-password" placeholder="Password"
                    value={form.userPassword} onChange={handleChange}
                    className="w-full pl-9 pr-10 py-2.5 border-[1.5px] border-emerald-100 rounded-lg text-sm text-gray-900 bg-emerald-50 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition" />
                  <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-[12.5px]">
                <Link to="/forgot-login-id" className="text-emerald-600 font-medium hover:underline">Forgot Login ID?</Link>
                <Link to="/forgot-password" className="text-emerald-600 font-medium hover:underline">Forgot Password?</Link>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-[15px] transition-colors flex items-center justify-center gap-2">
                {loading ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</>) : 'Sign In'}
              </button>
            </form>
          </div>
          <div className="px-7 py-4 text-center border-t border-gray-100 text-[13px] text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 font-semibold hover:underline">Register Here</Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
